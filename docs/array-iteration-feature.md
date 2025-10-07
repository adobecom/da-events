# Array Iteration with Flexible Concatenation

This feature extends the existing placeholder system to support array iteration with flexible concatenation options, including object attribute extraction and nested array handling.

## Syntax

Use the `[[@array(metadata-path.attribute)separator]]` syntax to iterate over arrays and join them with any separator you specify.

## Examples

### Basic Usage with Comma

```html
<!-- Metadata: contacts = ["John Doe", "Jane Smith", "Bob Johnson"] -->
<p>Contact us: [[@array(contacts),]]</p>
<!-- Output: Contact us: John Doe, Jane Smith, Bob Johnson -->
```

### Object Attribute Extraction

```html
<!-- Metadata: speakers = [{"name": "Dr. Alice Brown", "title": "Senior Researcher"}, {"name": "Prof. Charlie Wilson", "title": "Professor"}] -->
<p>Speakers: [[@array(speakers.name),]]</p>
<!-- Output: Speakers: Dr. Alice Brown, Prof. Charlie Wilson -->

<p>Speakers: [[@array(speakers.title) | ]]</p>
<!-- Output: Speakers: Senior Researcher | Professor -->
```

### Custom Separators

```html
<!-- Using pipe separator -->
<p>Contact us: [[@array(contacts) | ]]</p>
<!-- Output: Contact us: John Doe | Jane Smith | Bob Johnson -->

<!-- Using bullet separator -->
<p>Contact us: [[@array(contacts) • ]]</p>
<!-- Output: Contact us: John Doe • Jane Smith • Bob Johnson -->

<!-- Using newline separator -->
<p>Contact us: [[@array(contacts)
]]</p>
<!-- Output: Contact us: John Doe
Jane Smith
Bob Johnson -->
```

### No Separator (Space Default)

```html
<!-- No separator specified -->
<p>Contact us: [[@array(contacts)]]</p>
<!-- Output: Contact us: John Doe Jane Smith Bob Johnson -->
```

### Nested Metadata Paths

```html
<!-- Metadata: event-data = {"organizers": ["Adobe Events", "Tech Partners"]} -->
<p>Organizers: [[@array(event-data.organizers),]]</p>
<!-- Output: Organizers: Adobe Events, Tech Partners -->

<!-- Nested objects with attribute extraction -->
<!-- Metadata: event-data = {"speakers": [{"name": "Dr. Alice", "title": "Researcher"}, {"name": "Prof. Bob", "title": "Professor"}]} -->
<p>Speakers: [[@array(event-data.speakers.name),]]</p>
<!-- Output: Speakers: Dr. Alice, Prof. Bob -->
```

## Object Handling

### With Attribute Specification
When you specify an attribute (e.g., `speakers.name`), the system extracts that attribute from each object in the array.

### Without Attribute Specification
When you don't specify an attribute (e.g., `speakers`), objects are converted to JSON strings.

## Separator Behavior

- **Author's Choice**: Use any separator you want (comma, pipe, bullet, etc.)
- **Space Default**: If no separator is provided, space is used as default
- **Exact Matching**: The separator you specify is used exactly as written

## Error Handling

- **Empty arrays**: Returns empty string
- **Non-array metadata**: Returns empty string
- **Missing metadata**: Returns empty string
- **Missing attributes**: Returns empty string for that item
- **Invalid paths**: Returns empty string

## Implementation Details

The feature is implemented in `events/scripts/content-update.js`:

1. **Detection**: The `getContent` function checks for `@array(` syntax
2. **Processing**: The `processArrayIteration` function handles the array parsing
3. **Path Resolution**: Uses `parseMetadataPath` to handle nested structures
4. **Attribute Extraction**: Extracts specific attributes from objects when specified
5. **Separator Logic**: Uses provided separator, defaults to space if none provided
6. **Integration**: Works seamlessly with existing placeholder processing

## Testing

Comprehensive tests are available in `test/unit/scripts/content-update.test.js` covering:

- Basic array iteration with commas
- Object attribute extraction
- Custom separators (pipes, bullets, etc.)
- No separator (space default)
- Nested array handling
- Missing attribute handling
- Error handling
- Edge cases

## Migration from Manual Lists

Instead of manually creating concatenated lists in metadata, you can now use arrays:

**Before:**
```html
<meta name="contacts" content="John Doe, Jane Smith, Bob Johnson">
<p>Contact us: [[contacts]]</p>
```

**After:**
```html
<meta name="contacts" content='["John Doe", "Jane Smith", "Bob Johnson"]'>
<p>Contact us: [[@array(contacts),]]</p>
```

**For objects:**
```html
<meta name="speakers" content='[{"name": "Dr. Alice", "title": "Researcher"}, {"name": "Prof. Bob", "title": "Professor"}]'>
<p>Speakers: [[@array(speakers.name),]]</p>
```

This approach provides cleaner data management, flexible concatenation options, and powerful object attribute extraction. 
