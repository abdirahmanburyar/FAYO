# Searchable Select Components

A comprehensive set of searchable select components for the FAYO AI Admin Panel, inspired by Vue Multiselect functionality.

## Components

### SearchableSelect
A single-select dropdown with search functionality, keyboard navigation, and smooth animations.

### MultiSelect
A multi-select dropdown built on top of SearchableSelect with support for multiple selections and tag display.

## Features

### 🔍 Search Functionality
- **Real-time filtering** as you type
- **Case-insensitive search** across option labels
- **Custom search placeholder** text
- **No results message** when no options match

### ⌨️ Keyboard Navigation
- **Arrow keys** to navigate options
- **Enter** to select highlighted option
- **Escape** to close dropdown
- **Tab** navigation support
- **Focus management** for accessibility

### 🎨 Visual Features
- **Smooth animations** with Framer Motion
- **Highlighted selection** with blue accent
- **Loading states** with spinner
- **Error states** with red styling
- **Disabled states** with gray styling
- **Clear button** to reset selection

### 📱 Responsive Design
- **Mobile-friendly** touch interactions
- **Responsive dropdown** positioning
- **Flexible width** options
- **Scrollable options** with max height

## Usage Examples

### Basic Single Select
```tsx
import { SearchableSelect, SelectOption } from '@/components/ui';

const options: SelectOption[] = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

<SearchableSelect
  options={options}
  value={selectedValue}
  onChange={setSelectedValue}
  placeholder="Select an option..."
  searchPlaceholder="Search options..."
/>
```

### Multi Select
```tsx
import { MultiSelect, SelectOption } from '@/components/ui';

<MultiSelect
  options={options}
  value={selectedValues}
  onChange={setSelectedValues}
  placeholder="Select multiple options..."
  maxSelections={5}
/>
```

### With Groups
```tsx
const groupedOptions: SelectOption[] = [
  { value: 'cat1', label: 'Category 1', group: 'Animals' },
  { value: 'cat2', label: 'Category 2', group: 'Animals' },
  { value: 'dog1', label: 'Dog 1', group: 'Pets' },
  { value: 'dog2', label: 'Dog 2', group: 'Pets' },
];

<SearchableSelect
  options={groupedOptions}
  value={selectedValue}
  onChange={setSelectedValue}
/>
```

### With Validation
```tsx
<SearchableSelect
  options={options}
  value={selectedValue}
  onChange={setSelectedValue}
  label="Required Field"
  required
  error={errors.field}
  className="mb-4"
/>
```

## Props

### SearchableSelect Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `SelectOption[]` | - | Array of select options |
| `value` | `string \| string[]` | - | Selected value(s) |
| `onChange` | `(value: string \| string[]) => void` | - | Change handler |
| `placeholder` | `string` | `'Select an option...'` | Placeholder text |
| `searchPlaceholder` | `string` | `'Search...'` | Search input placeholder |
| `multiple` | `boolean` | `false` | Enable multiple selection |
| `disabled` | `boolean` | `false` | Disable the select |
| `className` | `string` | `''` | Additional CSS classes |
| `maxHeight` | `string` | `'200px'` | Max height of options list |
| `allowClear` | `boolean` | `false` | Show clear button |
| `noOptionsText` | `string` | `'No options found'` | Text when no options |
| `loading` | `boolean` | `false` | Show loading state |
| `error` | `string` | - | Error message |
| `label` | `string` | - | Label text |
| `required` | `boolean` | `false` | Mark as required |

### MultiSelect Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `maxSelections` | `number` | - | Maximum number of selections |
| All SearchableSelect props | - | - | Inherits all SearchableSelect props |

### SelectOption Interface

```tsx
interface SelectOption {
  value: string;           // Unique value
  label: string;           // Display text
  disabled?: boolean;      // Disable this option
  group?: string;          // Group name for organization
}
```

## Styling

### CSS Classes
- `.searchable-select` - Main container
- `.searchable-select--open` - When dropdown is open
- `.searchable-select--disabled` - When disabled
- `.searchable-select--error` - When has error
- `.searchable-select__option` - Individual option
- `.searchable-select__option--selected` - Selected option
- `.searchable-select__option--highlighted` - Highlighted option

### Custom Styling
```tsx
<SearchableSelect
  options={options}
  value={value}
  onChange={onChange}
  className="custom-select"
  maxHeight="300px"
/>
```

## Advanced Features

### Custom Option Rendering
The component automatically handles:
- **Option grouping** with headers
- **Selected state** indicators
- **Disabled state** styling
- **Highlighted state** during keyboard navigation

### Accessibility
- **ARIA labels** for screen readers
- **Keyboard navigation** support
- **Focus management** for proper tab order
- **Role attributes** for dropdown semantics

### Performance
- **Virtual scrolling** for large option lists
- **Debounced search** to prevent excessive filtering
- **Memoized options** to prevent unnecessary re-renders
- **Efficient filtering** with case-insensitive matching

## Integration Examples

### Form Integration
```tsx
const [formData, setFormData] = useState({
  city: '',
  status: '',
  specialties: []
});

<SearchableSelect
  options={cityOptions}
  value={formData.city}
  onChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
  label="City"
  required
/>
```

### API Integration
```tsx
const [options, setOptions] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  fetchOptions().then(data => {
    setOptions(data);
    setLoading(false);
  });
}, []);

<SearchableSelect
  options={options}
  value={selectedValue}
  onChange={setSelectedValue}
  loading={loading}
  noOptionsText="No data available"
/>
```

## Best Practices

1. **Use meaningful labels** - Make option labels descriptive and user-friendly
2. **Group related options** - Use the `group` property for better organization
3. **Handle loading states** - Show loading indicators for async data
4. **Provide clear placeholders** - Help users understand what to select
5. **Validate selections** - Use the `error` prop for validation feedback
6. **Consider accessibility** - Always provide labels and handle keyboard navigation
7. **Optimize performance** - Use memoization for large option lists
8. **Test edge cases** - Handle empty states, loading states, and errors

## Browser Support

- **Chrome** 60+
- **Firefox** 55+
- **Safari** 12+
- **Edge** 79+

## Dependencies

- **React** 18+
- **Framer Motion** 10+
- **Lucide React** (for icons)
- **Tailwind CSS** (for styling)
