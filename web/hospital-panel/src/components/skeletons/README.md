# Skeleton Loading Components

A comprehensive set of skeleton loading components for the FAYO AI Admin Panel, designed to provide smooth loading states and improve user experience.

## Components

### SkeletonCard
A card-style skeleton with header, content, and footer sections.

```tsx
import { SkeletonCard } from '@/components/skeletons';

<SkeletonCard height="h-48" className="mb-4" />
```

**Props:**
- `className?: string` - Additional CSS classes
- `height?: string` - Height of the content area (default: 'h-48')

### SkeletonTable
A table skeleton with configurable rows and columns.

```tsx
import { SkeletonTable } from '@/components/skeletons';

<SkeletonTable rows={5} columns={4} />
```

**Props:**
- `rows?: number` - Number of table rows (default: 5)
- `columns?: number` - Number of table columns (default: 4)
- `className?: string` - Additional CSS classes

### SkeletonStats
A grid of statistics cards skeleton.

```tsx
import { SkeletonStats } from '@/components/skeletons';

<SkeletonStats count={4} />
```

**Props:**
- `count?: number` - Number of stat cards (default: 4)
- `className?: string` - Additional CSS classes

### SkeletonList
A list skeleton with items and actions.

```tsx
import { SkeletonList } from '@/components/skeletons';

<SkeletonList items={6} />
```

**Props:**
- `items?: number` - Number of list items (default: 6)
- `className?: string` - Additional CSS classes

### SkeletonForm
A form skeleton with fields and buttons.

```tsx
import { SkeletonForm } from '@/components/skeletons';

<SkeletonForm fields={5} />
```

**Props:**
- `fields?: number` - Number of form fields (default: 5)
- `className?: string` - Additional CSS classes

### SkeletonProfile
A profile card skeleton with avatar and information.

```tsx
import { SkeletonProfile } from '@/components/skeletons';

<SkeletonProfile />
```

**Props:**
- `className?: string` - Additional CSS classes

### SkeletonShimmer
A shimmer effect wrapper for enhanced visual appeal.

```tsx
import { SkeletonShimmer } from '@/components/skeletons';

<SkeletonShimmer className="bg-white rounded-lg p-4">
  <div className="h-4 bg-gray-200 rounded w-32"></div>
</SkeletonShimmer>
```

**Props:**
- `className?: string` - Additional CSS classes
- `children?: React.ReactNode` - Content to apply shimmer effect to

## Usage Examples

### Page Loading State
```tsx
if (loading) {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>

      {/* Stats Skeleton */}
      <SkeletonStats count={4} />

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </div>
  );
}
```

### Table Loading State
```tsx
if (loading) {
  return <SkeletonTable rows={8} columns={6} />;
}
```

### Form Loading State
```tsx
if (loading) {
  return <SkeletonForm fields={5} />;
}
```

## Styling

The skeleton components use Tailwind CSS classes and include:

- **Base colors**: `bg-gray-200` for skeleton elements
- **Animations**: `animate-pulse` for subtle pulsing effect
- **Shimmer effect**: Custom CSS animation for enhanced visual appeal
- **Responsive design**: Mobile-friendly layouts

## Customization

You can customize the skeleton components by:

1. **Passing custom className props**
2. **Modifying the base CSS in `skeleton.css`**
3. **Creating custom skeleton components following the same pattern**

## Best Practices

1. **Match the actual content structure** - Skeleton should closely resemble the final content
2. **Use appropriate component types** - Choose the right skeleton for your content type
3. **Keep loading times reasonable** - Don't show skeletons for too long
4. **Provide fallback content** - Always have error states and empty states
5. **Test on different screen sizes** - Ensure skeletons work on mobile and desktop

## Performance

- Skeleton components are lightweight and optimized
- Shimmer effects use CSS animations for smooth performance
- No external dependencies required
- Minimal JavaScript overhead
