const Footer = () => {
  return (
    <footer className="mt-12 py-8 border-t border-border/40">
      <div className="container mx-auto px-4 flex flex-col items-center gap-3">
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
