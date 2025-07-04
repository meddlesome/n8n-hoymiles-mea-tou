/**
 * MEA Time-of-Use (TOU) Consumption Calculator for n8n
 * Calculates on-peak and off-peak consumption based on MEA rate structure
 * Input: dateString from CONFIGURATION node, dataList from input node
 * 
 * Created by @meddlesome (https://github.com/meddlesome/)
 * Source maintained at: https://github.com/meddlesome/n8n-hoymiles-mea-tou
 */

// Get inputs from n8n nodes
const dateString = $('Split Out').item.json.date;
const dataList = $input.item.json.data[0].data_list;

/**
 * MEA TOU Rate Structure:
 * On-peak: 09:00 - 22:00, Monday - Friday
 * Off-peak: 22:00 - 09:00, Monday - Friday
 *          : 00:00 - 24:00, Saturday - Sunday + National holidays
 */

// Parse date and determine if it's a weekday
const date = new Date(dateString);
const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

// Official Thai national holidays for 2568 (2025)
const thaiHolidays = [
    '2025-01-01', // วันขึ้นปีใหม่ - New Year's Day
    '2025-02-12', // วันมาฆบูชา - Makha Bucha Day
    '2025-04-06', // วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช และวันที่ระลึกมหาจักรีบรมราชวงศ์ - Chakri Memorial Day
    '2025-04-13', // วันสงกรานต์ - Songkran Festival
    '2025-04-14', // วันสงกรานต์ - Songkran Festival
    '2025-04-15', // วันสงกรานต์ - Songkran Festival
    '2025-05-01', // วันแรงงานแห่งชาติ - National Labour Day
    '2025-05-04', // วันฉัตรมงคล - Coronation Day
    '2025-05-11', // วันวิสาขบูชา - Visakha Bucha Day
    '2025-06-03', // วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี - Queen's Birthday
    '2025-07-10', // วันอาสาฬหบูชา - Asarnha Bucha Day
    '2025-07-11', // วันเข้าพรรษา - Buddhist Lent Day
    '2025-07-28', // วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระปรเมนทรรามาธิบดีศรีสินทรมหาวชิราลงกรณ - King's Birthday
    '2025-08-12', // วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง และวันแม่แห่งชาติ - Queen Mother's Birthday/Mother's Day
    '2025-10-13', // วันนวมินทรมหาราช - King Bhumibol Memorial Day
    '2025-10-23', // วันปิยมหาราช - King Chulalongkorn Memorial Day
    '2025-12-05', // วันคล้ายวันพระบรมราชสมภพของพระบาทสมเด็จพระบรมชนกาธิเบศร มหาภูมิพลอดุลยเดชมหาราช - King Bhumibol's Birthday/National Day/Father's Day
    '2025-12-10', // วันรัฐธรรมนูญ - Constitution Day
    '2025-12-31'  // วันสิ้นปี - New Year's Eve
];

const isHoliday = thaiHolidays.includes(dateString);
const isOffPeakDay = isWeekend || isHoliday;

// Convert time string to minutes for comparison
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// TOU period boundaries (in minutes)
const onPeakStart = timeToMinutes("09:00"); // 540 minutes
const onPeakEnd = timeToMinutes("22:00");   // 1320 minutes

let offPeakConsumption = 0;
let onPeakConsumption = 0;
let totalConsumption = 0;

// Solar consumption tracking (actual grid consumption after solar offset)
let offPeakSolarConsumption = 0;
let onPeakSolarConsumption = 0;
let totalSolarConsumption = 0;
let totalToGrid = 0;

// Process each data point
dataList.forEach(item => {
    const timeMinutes = timeToMinutes(item.date);
    const consumption = parseInt(item.consumption_power);
    const gridPower = parseInt(item.grid_p_power);
    
    totalConsumption += consumption;
    
    // Calculate solar consumption (grid power after solar offset)
    // Positive grid_p_power = buying from grid (actual consumption)
    // Negative grid_p_power = selling to grid (solar excess)
    const solarConsumption = Math.max(0, gridPower); // Only positive values count as consumption
    const toGrid = Math.abs(Math.min(0, gridPower)); // Absolute value of negative grid power
    
    totalSolarConsumption += solarConsumption;
    totalToGrid += toGrid;
    
    // Determine TOU period based on day type and time
    if (isOffPeakDay) {
        // Weekend/Holiday = All day off-peak
        offPeakConsumption += consumption;
        offPeakSolarConsumption += solarConsumption;
    } else {
        // Weekday = Check time for on-peak vs off-peak
        if (timeMinutes >= onPeakStart && timeMinutes < onPeakEnd) {
            onPeakConsumption += consumption;
            onPeakSolarConsumption += solarConsumption;
        } else {
            offPeakConsumption += consumption;
            offPeakSolarConsumption += solarConsumption;
        }
    }
});

// Convert watts to kWh (divide by 4000 for 15-minute intervals)
// 1 kWh = 1000W * 1 hour, and we have 4 intervals per hour (15 minutes each)
// So to convert 15-minute watt readings to kWh: watts / 4000
const wattsToKwh = (watts) => watts / 4000;

// Calculate derived values
const totalFromSolar = totalConsumption - totalSolarConsumption;
const totalProduction = totalFromSolar + totalToGrid;

// Return structured JSON object for n8n
return {
    date: dateString,
    tou_date: isOffPeakDay,
    consumption: {
        total: wattsToKwh(totalConsumption),
        off_peak: wattsToKwh(offPeakConsumption),
        on_peak: wattsToKwh(onPeakConsumption)
    },
    consumption_solar: {
        total: wattsToKwh(totalSolarConsumption),
        off_peak: wattsToKwh(offPeakSolarConsumption),
        on_peak: wattsToKwh(onPeakSolarConsumption),
        to_grid: wattsToKwh(totalToGrid),
        from_solar: wattsToKwh(totalFromSolar),
        total_production: wattsToKwh(totalProduction)
    },
    unit: "kWh"
};