# MEA TOU Consumption Calculator

A JavaScript snippet for calculating MEA (Metropolitan Electricity Authority) Time-of-Use (TOU) electricity consumption from Hoymiles solar monitoring data, designed for n8n workflow automation.

## Overview

This calculator processes solar consumption data and categorizes it into MEA's TOU rate periods:
- **On-peak**: 09:00 - 22:00 (Monday - Friday)
- **Off-peak**: 22:00 - 09:00 (Monday - Friday) + All day weekends/holidays

## Features

- ✅ Accurate MEA TOU rate compliance
- ✅ Complete 2025 Thai national holidays (B.E. 2568)
- ✅ n8n workflow integration
- ✅ Hoymiles data structure support
- ✅ Weekend and holiday detection
- ✅ Precise consumption categorization

## Input Requirements

### n8n Node Structure
```javascript
// From CONFIGURATION node
const dateString = $('CONFIGURATION').first().json.date; // Format: "YYYY-MM-DD"

// From input node (Hoymiles data)
const dataList = $input.first().json.data[0].data_list;
```

### Hoymiles Data Format
```json
{
  "data": [{
    "data_list": [
      {
        "date": "00:00",
        "consumption_power": "5790"
      },
      {
        "date": "00:15", 
        "consumption_power": "4270"
      }
      // ... 15-minute intervals for 24 hours
    ]
  }]
}
```

## Output Structure

```json
{
  "date": "2025-06-10",
  "tou_date": false,
  "consumption": {
    "total": 156479,
    "off-peak": 93367,
    "on-peak": 63112,
    "unit": "Watt"
  }
}
```

### Output Fields
| Field | Type | Description |
|-------|------|-------------|
| `date` | string | Input date (YYYY-MM-DD) |
| `tou_date` | boolean | `true` if off-peak day (weekend/holiday) |
| `consumption.total` | number | Total daily consumption in Watts |
| `consumption.off-peak` | number | Off-peak period consumption in Watts |
| `consumption.on-peak` | number | On-peak period consumption in Watts |
| `consumption.unit` | string | Always "Watt" |

## TOU Logic

### Weekdays (Monday - Friday)
- **On-peak**: 09:00 - 22:00 
- **Off-peak**: 22:00 - 09:00 (next day)

### Weekends & Holidays
- **All day off-peak**: 00:00 - 24:00
- **On-peak**: 0 Watts (no on-peak consumption)

## 2025 Thai National Holidays

The calculator includes all 19 official holidays for B.E. 2568:

| Date | Holiday |
|------|---------|
| 2025-01-01 | New Year's Day |
| 2025-02-12 | Makha Bucha Day |
| 2025-04-06 | Chakri Memorial Day |
| 2025-04-13 | Songkran Festival |
| 2025-04-14 | Songkran Festival |
| 2025-04-15 | Songkran Festival |
| 2025-05-01 | National Labour Day |
| 2025-05-04 | Coronation Day |
| 2025-05-11 | Visakha Bucha Day |
| 2025-06-03 | Queen's Birthday |
| 2025-07-10 | Asarnha Bucha Day |
| 2025-07-11 | Buddhist Lent Day |
| 2025-07-28 | King's Birthday |
| 2025-08-12 | Queen Mother's Birthday/Mother's Day |
| 2025-10-13 | King Bhumibol Memorial Day |
| 2025-10-23 | King Chulalongkorn Memorial Day |
| 2025-12-05 | King Bhumibol's Birthday/National Day/Father's Day |
| 2025-12-10 | Constitution Day |
| 2025-12-31 | New Year's Eve |

## Usage Examples

### Example 1: Weekday Calculation
```json
{
  "date": "2025-06-10",
  "tou_date": false,
  "consumption": {
    "total": 156479,
    "off-peak": 93367,
    "on-peak": 63112,
    "unit": "Watt"
  }
}
```

### Example 2: Weekend Calculation  
```json
{
  "date": "2025-06-14",
  "tou_date": true,
  "consumption": {
    "total": 156479,
    "off-peak": 156479,
    "on-peak": 0,
    "unit": "Watt"
  }
}
```

### Example 3: Holiday Calculation
```json
{
  "date": "2025-05-01",
  "tou_date": true,
  "consumption": {
    "total": 156479,
    "off-peak": 156479,
    "on-peak": 0,
    "unit": "Watt"
  }
}
```

## n8n Implementation Steps

1. **Setup CONFIGURATION Node**
   - Add field: `date` (string, YYYY-MM-DD format)
   - Example: `"2025-06-10"`

2. **Connect Hoymiles Data Input**
   - Ensure data structure: `data[0].data_list`
   - 15-minute interval consumption data

3. **Add Code Node**
   - Paste the JavaScript calculator code
   - Node will automatically process inputs

4. **Output Processing**
   - Structured JSON with TOU classification
   - Ready for cost calculation or database storage

## Code Location

The complete JavaScript code is available in the artifact: `tou-calculator`

## Technical Details

- **Time Conversion**: Converts HH:MM to minutes for precise comparison
- **Date Parsing**: Uses JavaScript Date object for day-of-week detection
- **Holiday Matching**: String comparison against official holiday list
- **Consumption Aggregation**: Sums 15-minute interval data by TOU period

## Validation

The calculator has been tested with:
- ✅ Weekday scenarios (normal TOU periods)
- ✅ Weekend scenarios (all off-peak)
- ✅ Holiday scenarios (all off-peak)
- ✅ Edge cases (midnight transitions)

## Future Enhancements

- [ ] Custom TOU period configuration
- [ ] Cost calculation integration

## Support

For questions or modifications, refer to the original development conversation and code artifact.