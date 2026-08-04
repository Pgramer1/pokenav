const REPO = 'https://github.com/Pgramer1/pokenav';

export function Footer() {
  return (
    <footer className="siteFooter">
      <div className="siteFooterInner">
        <div className="footerBrand">
          <img src="/pokeball.png" alt="" width={18} height={18} className="brandMark" />
          <span>pokenav</span>
        </div>

        <p className="footerNote">
          Code is MIT. The bundled sprites are fan-derived Pokémon artwork and are not covered
          by that license — see the sprite notice before shipping anything commercial.
        </p>

        <nav className="footerLinks" aria-label="Project links">
          <a href="https://www.npmjs.com/package/pokenav" target="_blank" rel="noreferrer">
            npm
          </a>
          <a href={REPO} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={`${REPO}/blob/main/SPRITES-NOTICE.md`} target="_blank" rel="noreferrer">
            Sprite notice
          </a>
          <a href={`${REPO}/blob/main/packages/pallet/LICENSE`} target="_blank" rel="noreferrer">
            License
          </a>
        </nav>
      </div>
    </footer>
  );
}
