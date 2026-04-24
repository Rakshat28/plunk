import type {Contact} from '@plunk/db';
import type {CursorPaginatedResponse} from '@plunk/types';
import {Input, Popover, PopoverContent, PopoverTrigger} from '@plunk/ui';
import {Check, ChevronsUpDown, MailCheck, MailX, Search, X} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import useSWR from 'swr';

interface ContactPickerProps {
  /** Currently selected emails */
  selected: string[];
  /** Called when selection changes */
  onChange: (emails: string[]) => void;
  /** Emails already in the segment (shown as disabled) */
  existing?: string[];
  placeholder?: string;
}

/**
 * Searchable multi-select contact picker backed by the /contacts API.
 * Only fetches when the user types (safe for large contact lists).
 */
export function ContactPicker({
  selected,
  onChange,
  existing = [],
  placeholder = 'Search contacts...',
}: ContactPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Only fetch when there's a search term — avoids loading all contacts on open
  const {data, isLoading} = useSWR<CursorPaginatedResponse<Contact>>(
    open && debouncedSearch.length > 0 ? `/contacts?limit=20&search=${encodeURIComponent(debouncedSearch)}` : null,
    {revalidateOnFocus: false},
  );

  const contacts = data?.data ?? [];

  const toggle = (email: string) => {
    if (selected.includes(email)) {
      onChange(selected.filter(e => e !== email));
    } else {
      onChange([...selected, email]);
    }
  };

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={v => { setOpen(v); if (!v) setSearch(''); }}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-500 hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
          >
            <span>{placeholder}</span>
            <ChevronsUpDown className="h-4 w-4 opacity-40 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          style={{width: 'var(--radix-popover-trigger-width)'}}
          align="start"
        >
          {/* Search input */}
          <div className="flex items-center border-b border-neutral-200 px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 text-neutral-400" />
            <Input
              placeholder="Type an email to search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border-0 p-0 h-8 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="max-h-[240px] overflow-y-auto p-1">
            {debouncedSearch.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-400">Type to search contacts</p>
            ) : isLoading ? (
              <p className="py-6 text-center text-sm text-neutral-400">Searching...</p>
            ) : contacts.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-400">No contacts found</p>
            ) : (
              contacts.map(contact => {
                const isSelected = selected.includes(contact.email);
                const isExisting = existing.includes(contact.email);

                return (
                  <button
                    key={contact.id}
                    type="button"
                    disabled={isExisting}
                    onClick={() => toggle(contact.email)}
                    className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed text-left transition-colors"
                  >
                    {contact.subscribed ? (
                      <MailCheck className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <MailX className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <span className="flex-1 truncate text-neutral-900">{contact.email}</span>
                    {isExisting && (
                      <span className="text-xs text-neutral-400 shrink-0">already member</span>
                    )}
                    {isSelected && !isExisting && (
                      <Check className="h-4 w-4 text-neutral-900 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map(email => (
            <span
              key={email}
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 border border-neutral-200 pl-3 pr-1.5 py-1 text-sm text-neutral-800"
            >
              {email}
              <button
                type="button"
                onClick={() => onChange(selected.filter(e => e !== email))}
                className="rounded-full p-0.5 hover:bg-neutral-300 transition-colors"
                aria-label={`Remove ${email}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
