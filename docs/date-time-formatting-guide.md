# Date Time Formatting Guide

This guide explains how to use the custom date time formatting system for events in the Events Milo platform.

## Overview

The system provides two ways to display event date and time information:

1. **Smart Auto-formatting** (Default) - Automatically formats dates based on whether the event is same-day or multi-day
2. **Custom Template Formatting** - Uses author-defined templates for complete control over date display

## Quick Start

### Basic Usage (Auto-formatting)

Simply use the placeholder in your content:

```html
<p>Event: [[user-event-date-time-range]]</p>
```

**Output Examples:**
- Same-day event: `"January 15, 2025 at 2:30 PM PST"`
- Multi-day event: `"January 15, 2025 at 2:30 PM PST - January 16, 2025 at 2:30 PM PST"`

### Custom Template Usage

Add the `custom-date-time-format` metadata field with your desired template:

**Metadata:**
```
custom-date-time-format: {LLL} {dd} | {timeRange} {timeZone}
```

**Content:**
```html
<p>Event: [[user-event-date-time-range]]</p>
```

**Output:**
```
Event: Jan 15 | 2:30 PM - 3:30 PM PST
```

## Template Tokens

| Token | Description | Example Output |
|-------|-------------|----------------|
| `{LLL}` | Short month name | `Jan`, `Oct`, `Dec` |
| `{dd}` | Day of month (padded) | `01`, `15`, `31` |
| `{ddd}` | Short day of week | `Mon`, `Tue`, `Wed` |
| `{timeRange}` | Time interval | `13:00 - 14:45` |
| `{timeZone}` | Timezone abbreviation | `PST`, `EDT`, `GMT` |

## Template Examples

### Standard Event Format
```
Template: {LLL} {dd} | {timeRange} {timeZone}
Output: Oct 20 | 13:00 - 14:45 PDT
```

### Full Date with Day
```
Template: {ddd}, {LLL} {dd} | {timeRange} {timeZone}
Output: Fri, Oct 20 | 13:00 - 14:45 PDT
```

### Time Only
```
Template: {timeRange} {timeZone}
Output: 13:00 - 14:45 PDT
```

### Date Only
```
Template: {ddd}, {LLL} {dd}
Output: Fri, Oct 20
```

### Verbose Format
```
Template: {ddd}, {LLL} {dd} from {timeRange} {timeZone}
Output: Fri, Oct 20 from 13:00 - 14:45 PDT
```

### Compact Format
```
Template: {dd}/{LLL} {timeRange}
Output: 20/Oct 13:00 - 14:45
```

## Localization Support

The system automatically adapts to different locales while maintaining the same template structure:

**Template:** `{ddd}, {LLL} {dd} | {timeRange} {timeZone}`

**English (en-US):**
```
Fri, Oct 20 | 1:00 PM - 2:45 PM PDT
```

**German (de-DE):**
```
Fr, Okt 20 | 13:00 - 14:45 PDT
```

**French (fr-FR):**
```
ven., oct. 20 | 13:00 - 14:45 PDT
```

## Implementation Guide

### For Content Authors

1. **Add the metadata field** in your event page metadata:
   ```
   custom-date-time-format: {LLL} {dd} | {timeRange} {timeZone}
   ```

2. **Use the placeholder** in your content:
   ```html
   <p>Join us: [[user-event-date-time-range]]</p>
   ```

3. **Preview and adjust** the template as needed

### For Developers

The system requires these metadata fields to be present:
- `local-start-time-millis` - Event start time (UTC timestamp in milliseconds)
- `local-end-time-millis` - Event end time (UTC timestamp in milliseconds)
- `custom-date-time-format` - Optional template string

## Best Practices

### Template Design
- **Keep it simple** - Complex templates can be hard to read
- **Consider mobile** - Shorter formats work better on small screens
- **Test with different locales** - Ensure your template works across languages
- **Include timezone** - Always show timezone for clarity

### Content Strategy
- **Use consistent templates** across similar event types
- **Create template variations** for different contexts (mobile, desktop, email)
- **Document your templates** for other content authors

## Common Use Cases

### Conference Events
```
Template: {ddd}, {LLL} {dd} | {timeRange} {timeZone}
Usage: Multi-day conferences with specific time slots
Example: Wed, Oct 20 | 9:00 AM - 5:00 PM PDT
```

### Webinars
```
Template: {LLL} {dd} | {timeRange} {timeZone}
Usage: Online events with clear time indication
Example: Oct 20 | 2:00 PM - 3:00 PM PDT
```

### All-Day Events
```
Template: {ddd}, {LLL} {dd}
Usage: Events without specific time requirements
Example: Wed, Oct 20
```

### Quick Reference
```
Template: {dd}/{LLL} {timeRange}
Usage: Compact displays, mobile interfaces
Example: 20/Oct 14:00 - 15:30
```

## Troubleshooting

### Template Not Working
- **Check metadata field name**: Must be exactly `custom-date-time-format`
- **Verify token syntax**: Tokens must be wrapped in curly braces `{}`
- **Ensure timestamps exist**: Both start and end timestamps are required

### Incorrect Formatting
- **Check locale settings**: Ensure the correct locale is configured
- **Verify timestamp format**: Must be UTC milliseconds
- **Test with different timezones**: Confirm DST handling works correctly

### Fallback Behavior
If the custom template fails or is missing, the system automatically falls back to smart auto-formatting:
- Same-day events show single date/time
- Multi-day events show date range

## Advanced Features

### Responsive Templates
You can create different templates for different screen sizes by using CSS or JavaScript to conditionally set the metadata:

```javascript
// Example: Set different templates based on screen size
const isMobile = window.innerWidth < 768;
const template = isMobile 
  ? '{dd}/{LLL} {timeRange}' 
  : '{ddd}, {LLL} {dd} | {timeRange} {timeZone}';
```

### Dynamic Templates
Templates can be set programmatically based on event type, duration, or other criteria:

```javascript
// Example: Different templates for different event types
const eventType = getMetadata('event-type');
const templates = {
  'webinar': '{LLL} {dd} | {timeRange} {timeZone}',
  'conference': '{ddd}, {LLL} {dd} | {timeRange} {timeZone}',
  'workshop': '{LLL} {dd} from {timeRange} {timeZone}'
};
```

## Support

For technical issues or questions about date time formatting:
1. Check this documentation first
2. Test with the provided examples
3. Verify your metadata configuration
4. Contact the development team with specific error details

---

*Last updated: October 2025*
