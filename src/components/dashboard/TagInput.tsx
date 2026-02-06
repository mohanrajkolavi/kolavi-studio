"use client";

import { useRef, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

type TagInputProps = {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  className?: string;
};

export function TagInput({
  tags,
  onTagsChange,
  placeholder = "Type and press Enter to add",
  maxTags = 10,
  disabled = false,
  className = "",
}: TagInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      const value = e.currentTarget.value.trim();
      if (!value) return;
      if (tags.length >= maxTags) return;
      if (tags.includes(value)) return;
      onTagsChange([...tags, value]);
      e.currentTarget.value = "";
    } else if (e.key === "Backspace") {
      const value = e.currentTarget.value.trim();
      if (!value && tags.length > 0) {
        e.preventDefault();
        onTagsChange(tags.slice(0, -1));
      }
    }
  }

  function removeTag(index: number) {
    onTagsChange(tags.filter((_, i) => i !== index));
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`flex min-h-10 flex-wrap gap-2 rounded-2xl border border-input bg-background px-3 py-2 transition-colors focus-within:ring-2 focus-within:ring-ring ${disabled ? "cursor-not-allowed opacity-60" : ""} ${className}`}
      onClick={() => inputRef.current?.focus()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }}
    >
      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 rounded-2xl bg-muted px-2.5 py-0.5 text-sm"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(i);
              }}
              className="rounded p-0.5 hover:bg-muted-foreground/20"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        placeholder={tags.length >= maxTags ? "" : placeholder}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="min-w-[120px] flex-1 border-0 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
    </div>
  );
}
