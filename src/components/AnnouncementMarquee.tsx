import React from "react";
import { Megaphone } from "lucide-react";

interface Props {
  text: string;
}

const AnnouncementMarquee: React.FC<Props> = ({ text }) => {
  if (!text) return null;

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/30 backdrop-blur-md">
      <div className="flex items-center px-4 py-3">
        <div className="relative z-10 flex shrink-0 items-center justify-center rounded-lg bg-amber-500 p-1.5 text-white shadow-lg shadow-amber-500/20">
          <Megaphone size={16} className="animate-bounce" />
        </div>
        
        <div className="relative flex flex-1 overflow-hidden ml-4">
          <div className="animate-marquee whitespace-nowrap py-1">
            <span className="mx-4 text-sm font-bold tracking-wide text-amber-500 uppercase">
              {text}
            </span>
            <span className="mx-4 text-sm font-bold tracking-wide text-amber-500 uppercase">
              {text}
            </span>
            <span className="mx-4 text-sm font-bold tracking-wide text-amber-500 uppercase">
              {text}
            </span>
            <span className="mx-4 text-sm font-bold tracking-wide text-amber-500 uppercase">
              {text}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 15s linear infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  );
};

export default AnnouncementMarquee;
