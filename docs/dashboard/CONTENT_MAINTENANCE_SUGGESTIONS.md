# Content Maintenance – Suggestions & future improvements

## Implemented in this pass
- **Redesign**: Clean, premium table and filters (aligned with Recent page).
- **Refresh button**: Reload list without full-page loading.
- **Error handling**: Inline dismissible error when fetch or update fails.
- **Empty state**: Context-aware copy (fetch error vs no results vs no WordPress); "Try again" action.
- **Note save**: Only PATCH when note actually changed (avoid redundant requests).
- **Modal**: Refined styling; "Saving…" hint when note is updating.
- **Post count**: Footer shows "Showing N posts" and "(filtered)" when filters are applied.

## Future suggestions

1. **Bulk actions**  
   Select multiple rows and "Mark as reviewed" or set status in one go.

2. **Export**  
   Export filtered list to CSV (title, slug, status, age, last reviewed, note).

3. **Sort**  
   Allow sort by age, last reviewed, or title (table header click or dropdown).

4. **Debounced category filter**  
   Debounce the category input so filter runs after typing stops (e.g. 300ms).

5. **Clear filters**  
   Single "Clear filters" link when any filter is active.

6. **Keyboard in modal**  
   Trap focus inside modal and restore focus to trigger element on close (a11y).

7. **Optimistic updates**  
   Update list and modal immediately on status/note change, then reconcile with server (or show error and revert).

8. **Pagination or virtual list**  
   If WordPress returns many posts, add pagination or virtual scrolling so the table stays performant.
