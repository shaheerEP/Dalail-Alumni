"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Check, ArrowLeft } from "lucide-react";
import { SAMPLE_ALUMNI_ROSTER } from "@/data/options";

export default function StepNameSearch({
  batch,
  selectedStudent,
  onSelectStudent,
  isManualEntry,
  onToggleManualEntry,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [roster, setRoster] = useState([]);
  const containerRef = useRef(null);

  // Load roster when batch changes
  useEffect(() => {
    if (batch) {
      const list = SAMPLE_ALUMNI_ROSTER[batch] || [];
      setRoster(list);
    } else {
      setRoster([]);
    }
  }, [batch]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredRoster = roster.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.place && item.place.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (student) => {
    setSearchTerm(student.name);
    onSelectStudent(student);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm("");
    onSelectStudent(null);
  };

  // If no roster records exist for this batch, skip the search dropdown
  if (!roster || roster.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 pt-2" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="block text-sm sm:text-base font-bold text-[#192200]">
          Select Your Name <span className="text-red-500">*</span>
        </label>

        {/* Name Not In List Action */}
        <button
          type="button"
          onClick={onToggleManualEntry}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#719100] hover:text-[#556d00] transition-colors py-1 px-2.5 rounded-lg hover:bg-[#eef2dc] cursor-pointer"
        >
          {isManualEntry ? (
            <>
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to list</span>
            </>
          ) : (
            <span>Not in list? Enter manually</span>
          )}
        </button>
      </div>

      {!isManualEntry ? (
        <div className="relative">
          <div className="flex items-center w-full rounded-xl bg-[#eef2dc] px-4 py-2.5 transition-all border border-[#719100]/15 focus-within:bg-white focus-within:ring-3 focus-within:ring-[#719100]/20 focus-within:border-[#719100]">
            <Search className="w-5 h-5 text-[#6e8242] shrink-0 mr-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search name or place..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="w-full bg-transparent text-[#192200] text-sm sm:text-base outline-none font-medium placeholder:text-[#6e8242]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[#6e8242] hover:text-[#192200] p-1 shrink-0 ml-1 cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && (
            <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-[#719100]/20 overflow-hidden max-h-60 overflow-y-auto">
              {filteredRoster.length > 0 ? (
                <div className="divide-y divide-[#719100]/10">
                  {filteredRoster.map((student) => (
                    <div
                      key={student.id || student.name}
                      onClick={() => handleSelect(student)}
                      className={`p-3 hover:bg-[#f5f7eb] cursor-pointer flex items-center justify-between transition-colors ${
                        selectedStudent?.id === student.id ? "bg-[#719100]/15 font-semibold" : ""
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold text-[#192200]">{student.name}</div>
                        {student.place && (
                          <div className="text-xs text-[#576b2d]">{student.place}</div>
                        )}
                      </div>
                      {selectedStudent?.id === student.id && (
                        <Check className="w-4 h-4 text-[#719100]" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-[#576b2d]">
                  <p>No matching name found.</p>
                  <button
                    type="button"
                    onClick={onToggleManualEntry}
                    className="mt-2 text-xs font-bold text-[#719100] hover:underline cursor-pointer"
                  >
                    Enter name manually
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#eef2dc] rounded-xl px-4 py-2.5 text-xs text-[#2d3a00] flex items-center justify-between border border-[#719100]/15">
          <span>Entering details manually</span>
          <button
            type="button"
            onClick={onToggleManualEntry}
            className="font-bold underline text-[#719100] hover:text-[#556d00] cursor-pointer"
          >
            Search list
          </button>
        </div>
      )}
    </div>
  );
}
