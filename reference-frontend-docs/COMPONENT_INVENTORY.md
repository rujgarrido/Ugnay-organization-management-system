# Component Inventory

The reference's reusable component system is strongest in `components/landing` and `components/shared/ui`. Ugnay should retain the compositional idea and use shadcn equivalents instead of cloning primitives.

| Category | Component pattern | Purpose and responsibilities | Typical props/dependencies | Ugnay need | shadcn equivalent |
|---|---|---|---|---|---|
| Primitive UI | Button | Consistent actions, variants, disabled state. | `variant`, `size`, children; CVA. | YES | Button |
| Primitive UI | Input/Label/Textarea | Accessible form controls. | Native control props; Label association. | YES | Input, Label, Textarea |
| Primitive UI | Select/Dropdown/Combobox | Constrained choices and searchable choices. | value, change handler, options; Radix/Command. | YES | Select, Dropdown Menu, Command |
| Primitive UI | Dialog/Alert Dialog/Sheet | Focus-managed overlays and destructive confirmation. | open, onOpenChange, content, action. | YES | Dialog, Alert Dialog, Sheet |
| Primitive UI | Tabs/Radio/Toggle/Switch | Mutually exclusive or boolean view state. | value/onValueChange or checked/onCheckedChange. | YES | Tabs, Radio Group, Toggle, Switch |
| Primitive UI | Table/Pagination | Semantic list presentation and navigation. | headers, rows, page controls; TanStack Table when needed. | YES | Table, Pagination |
| Form | Form, FormField, FormControl | Connect RHF field state to accessible UI. | `control`, `name`, render field; RHF context. | YES | Existing shadcn form pattern |
| Form | FormMessage/FormDescription | Field guidance and validation feedback. | children or derived field error. | YES | Existing shadcn form pattern |
| Data | DataTable | Feature-specific table composition over primitives. | columns, rows, loading, empty, row actions. | YES | Compose Table + TanStack Table |
| Data | Filters/Search | URL-backed query controls. | search, filter values, reset; React Router params. | YES | Input, Select, Popover |
| Data | Pagination | Maps page state to query params. | page, pageSize, total, onChange. | YES | Pagination |
| Application | AppShell | Authenticated sidebar, top bar, outlet. | navigation, user, children; Router layout. | YES | Compose Sidebar, Sheet, Breadcrumb |
| Application | PermissionGate | Hides or disables UI based on capability. | permission(s), fallback, children; auth hook. | YES | Custom domain component |
| Feedback | Loading/Skeleton | Preserve layout while requests are pending. | count, className; query status. | YES | Skeleton |
| Feedback | EmptyState | Explain no records and offer a next action. | title, description, action. | YES | Custom composition |
| Feedback | ErrorState | Retryable request failure with safe message. | error, retry, support action. | YES | Alert + Button |
| Feedback | Toast | Brief command confirmation. | title, description, variant; Sonner or shadcn toast. | YES | Sonner or Toast |
| Public content | Landing CTA/FAQ/Pricing | Marketing section composition. | content arrays and visual variants. | LATER | Custom, not a dashboard primitive |

## Boundaries

Primitive components should know accessibility and presentation, not backend endpoints. Feature components may know domain labels and render query results, but mutation calls belong in hooks. Page components should compose and route, not become giant all-in-one screens like the reference dashboard.

## Duplication Rule

If shadcn provides the behavior, use it. Customize through composition and variants. Create a new component only when it adds a domain responsibility, such as `TransactionTable` or `PermissionGate`, rather than renaming a generic primitive.