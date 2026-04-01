import { Coffee } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-12 py-8 border-t border-border/40">
      <div className="container mx-auto px-4 flex flex-col items-center gap-6">
        {/* Support Section */}
        <div className="flex flex-col items-center text-center max-w-md">
          <h4 className="font-display text-xl text-foreground mb-2">Enjoying IPL Predictor Pro?</h4>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Love predicting the match results? This platform was built with passion to bring fans together. 
            If you enjoy it, consider supporting its growth!
          </p>
          <a
            href="https://www.buymeacoffee.com/manoharcb"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-[#FFDD00] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#FFDD00]/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <Coffee size={18} fill="currentColor" />
            <span>Buy me a coffee</span>
          </a>
        </div>

        {/* Credits */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Developed with ❤️ by <span className="text-foreground font-semibold">Manohar</span>
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">
            IPL PREDICTOR PRO © 2026
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
