'use client';

import React, { useMemo, useState } from "react";

interface HistoryRow {
  id: number;
  round_start_time: string;
  a1: number | null;
  a2: number | null;
  b1: number | null;
  b2: number | null;
  c1: number | null;
  c2: number | null;
  created_at?: string;
}

function formatDateTime(date: string | null | undefined) {
  if (!date) return "--";
  const d = new Date(date);

  const datePart = d.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  const timePart = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return { datePart, timePart };
}

export default function History({ history }: { history: HistoryRow[] }) {
  const [selectedDate, setSelectedDate] = useState<string>("");

  const filteredHistory = useMemo(() => {
    if (!selectedDate) return history;

    return history.filter((row) => {
      if (!row.round_start_time) return false;

      const d = new Date(row.round_start_time);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");

      return `${y}-${m}-${day}` === selectedDate;
    });
  }, [selectedDate, history]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-black text-white p-6">

      {/* HEADER */}
      <h1 className="text-3xl font-extrabold text-center mb-3 text-green-400 tracking-widest">
        🎰 Old RESULTS
      </h1>

      {/* DATE FILTER */}
      <div className="flex justify-center mb-8">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="
            bg-black/70
            border border-green-500/40
            text-green-300
            px-5 py-2.5
            rounded-xl
            text-lg
            focus:outline-none
            focus:ring-2
            focus:ring-green-500
          "
        />
      </div>

      {/* RESULTS */}
      <div className="space-y-8 max-w-4xl mx-auto">
        {filteredHistory.length === 0 ? (
          <div className="text-center text-gray-400 text-xl">
            No results found
          </div>
        ) : (
          filteredHistory.map((row: HistoryRow) => {
            const start = formatDateTime(row.round_start_time);

            return (
              <div
                key={row.id}
                className="
                  rounded-3xl
                  bg-black/80
                  border border-green-500/40
                  px-8 py-6
                  shadow-[0_0_40px_rgba(34,197,94,0.35)]
                "
              >
                {/* RESULT */}
                <div className="grid grid-cols-3 gap-8 text-center mb-8">
                  {[
                    { label: "A", value: `${row.a1}${row.a2}` },
                    { label: "B", value: `${row.b1}${row.b2}` },
                    { label: "C", value: `${row.c1}${row.c2}` },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="text-3xl font-extrabold text-red-600 mb-2">
                        {item.label}
                      </div>
                      <div className="text-5xl font-extrabold text-green-400 tracking-widest drop-shadow-lg">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* TIME */}
                <div className="grid grid-cols-2 gap-8 text-center">
                  <div>
                    <div className="text-lg font-semibold text-green-300 mb-1">
                      START
                    </div>
                    {/* <div className="text-xl text-gray-300">{start.datePart}</div>
                    <div className="text-3xl font-bold text-white">
                      {start.timePart}
                    </div> */}
                  </div>

                  <div>
                    <div className="text-lg font-semibold text-green-300 mb-1">
                      END
                    </div>
                    {/* <div className="text-xl text-gray-300">{end.datePart}</div>
                    <div className="text-3xl font-bold text-white">
                      {end.timePart} */}
                    {/* </div> */}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
