"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, Users, Users2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import gql from "graphql-tag";
import { useLazyQuery } from "@apollo/client/react";
import { debounce } from "@/lib/debounce";
import { SearchResponse } from "@/types/userTypes";
import { manageHighValue } from "@/lib/manageHighValue";
import { useRouter } from "next/navigation";

const SEARCH_ACTION = gql`
  query HandleSearch($query: String!, $searchType: String!, $cursor: String) {
    handleSearch(query: $query, searchType: $searchType, cursor: $cursor) {
      success
      message
      data {
        id
        name
        imgUrl
        designation
        _count {
          members
        }
      }
      nextCursor
    }
  }
`;

interface SearchItem {
  id: string;
  name: string;
  imgUrl: string;
  designation?: string;
  _count?: { members: number };
}

export default function SearchBar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"people" | "community">("people");
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const [hasMore, setHasMore] = useState(false);

  const [fetchSearch, { loading }] = useLazyQuery<SearchResponse>(
    SEARCH_ACTION,
    {
      fetchPolicy: "network-only",
    }
  );

  // Fetch results
  const handleSearchAction = async (
    searchQuery: string,
    cursor?: string,
    append = false
  ) => {
    if (!searchQuery.trim()) return;

    try {
      const res = await fetchSearch({
        variables: {
          query: searchQuery,
          searchType: activeTab,
          cursor,
        },
      });

      const result = res.data?.handleSearch;

      if (result?.success) {
        setSearchItems((prev) =>
          append ? [...prev, ...result.data] : result.data
        );
        setNextCursor(result.nextCursor);
        setHasMore(!!result.nextCursor);
      }
    } catch (err) {
      console.error("Error searching :", err);
    }
  };

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((val: string) => {
      handleSearchAction(val);
    }, 500),
    [activeTab]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    debouncedSearch(val);
  };

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 300 &&
        hasMore &&
        !loading
      ) {
        handleSearchAction(query, nextCursor, true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [nextCursor, hasMore, loading, query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))] rounded-2xl shadow-2xl w-[90%] max-w-lg p-6 relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-semibold">Search</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[hsl(var(--muted))] transition"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-5">
              <button
                onClick={() => {
                  setActiveTab("people");
                  setSearchItems([]);
                  setQuery("");
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                  activeTab === "people"
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
                }`}
              >
                <Users size={18} /> People
              </button>
              <button
                onClick={() => {
                  setActiveTab("community");
                  setSearchItems([]);
                  setQuery("");
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                  activeTab === "community"
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
                }`}
              >
                <Users2 size={18} /> Communities
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-2 bg-[hsl(var(--muted))] rounded-xl px-4 py-3 mb-5">
              <Search
                size={20}
                className="text-[hsl(var(--muted-foreground))]"
              />
              <input
                type="text"
                value={query}
                onChange={handleChange}
                placeholder={`Search ${
                  activeTab === "people" ? "people" : "communities"
                }...`}
                className="bg-transparent outline-none flex-1 text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))]"
              />
            </div>

            {/* Results */}
            <div className="space-y-3 h-[250px] overflow-y-auto scrollbar-thin">
              {loading && query ? (
                <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
                  Searching...
                </p>
              ) : searchItems.length > 0 ? (
                searchItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[hsl(var(--accent))] transition cursor-pointer"
                  >
                    <img
                      src={item.imgUrl || "/placeholder.png"}
                      alt={item.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        onClose();
                        activeTab === "people"
                          ? router.push(
                              `${process.env.NEXT_PUBLIC_URL}/view/${item.id}`
                            )
                          : router.push(
                              `${process.env.NEXT_PUBLIC_URL}/community/${item.id}`
                            );
                      }}
                    >
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {activeTab === "people"
                          ? item.designation || "No designation"
                          : `${manageHighValue(
                              item._count?.members ?? 0
                            )} members`}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                query && (
                  <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
                    No results found
                  </p>
                )
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
