import { useState } from "react";

// ─── Seed Data ───────────────────────────────────────────────────────────────
const SEED_LISTINGS = [
  { id: "l1", sellerId: "u2", make: "Toyota", model: "Camry", year: 2021, price: 24500, mileage: 32000, color: "Pearl White", description: "One owner, full service history. Clean title.", image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&q=80", status: "active", createdAt: "2026-06-01" },
  { id: "l2", sellerId: "u2", make: "Honda", model: "CR-V", year: 2022, price: 31000, mileage: 18500, color: "Sonic Gray", description: "AWD, panoramic roof, Honda Sensing package.", image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=600&q=80", status: "active", createdAt: "2026-06-10" },
  { id: "l3", sellerId: "u3", make: "BMW", model: "3 Series", year: 2020, price: 38000, mileage: 41000, color: "Alpine White", description: "Sport line, leather interior, heated seats.", image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80", status: "active", createdAt: "2026-06-15" },
  { id: "l4", sellerId: "u3", make: "Ford", model: "F-150", year: 2023, price: 52000, mileage: 9800, color: "Velocity Blue", description: "XLT trim, tow package, bed liner.", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", status: "sold", createdAt: "2026-05-20", soldAt: "2026-06-20", salePrice: 51500 },
];

const SEED_USERS = [
  { id: "u1", name: "Alex Morgan", email: "alex@example.com", role: "buyer", balance: 0, referrals: [] },
  { id: "u2", name: "Jordan Smith", email: "jordan@example.com", role: "seller", balance: 0, referrals: [] },
  { id: "u3", name: "Taylor Reeves", email: "taylor@example.com", role: "seller", balance: 0, referrals: [] },
  { id: "u4", name: "Sam Rivera", email: "sam@example.com", role: "promoter", balance: 515, referrals: ["l4"] },
  { id: "admin", name: "Admin", email: "admin@drivelink.com", role: "admin", balance: 0, referrals: [] },
];

const SEED_REFERRALS = [
  { id: "r1", promoterId: "u4", listingId: "l4", shareCode: "SAM-L4", status: "paid", commissionAmount: 515, createdAt: "2026-06-18", paidAt: "2026-06-20" },
];

const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(SEED_USERS);
  const [listings, setListings] = useState(SEED_LISTINGS);
  const [referrals, setReferrals] = useState(SEED_REFERRALS);
  const [view, setView] = useState("home");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const login = (userId) => {
    setCurrentUser(users.find(u => u.id === userId));
    setView("home");
  };

  const logout = () => { setCurrentUser(null); setView("home"); };

  const activeListings = listings.filter(l => l.status === "active");

  const postListing = (data) => {
    const newListing = { ...data, id: "l" + Date.now(), sellerId: currentUser.id, status: "active", createdAt: new Date().toISOString().slice(0, 10) };
    setListings(prev => [newListing, ...prev]);
    showToast("Listing posted successfully!");
    setView("myListings");
  };

  const markSold = (listingId, salePrice) => {
    setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: "sold", soldAt: new Date().toISOString().slice(0, 10), salePrice } : l));
    const rel = referrals.find(r => r.listingId === listingId && r.status === "pending");
    if (rel) {
      const commission = Math.round(salePrice * 0.01);
      setReferrals(prev => prev.map(r => r.id === rel.id ? { ...r, status: "paid", commissionAmount: commission, paidAt: new Date().toISOString().slice(0, 10) } : r));
      setUsers(prev => prev.map(u => u.id === rel.promoterId ? { ...u, balance: (u.balance || 0) + commission } : u));
      showToast(`Sale recorded! ${fmt(commission)} commission paid to promoter.`);
    } else {
      showToast("Sale recorded!");
    }
    setModal(null);
  };

  const generateShare = (listingId) => {
    const existing = referrals.find(r => r.listingId === listingId && r.promoterId === currentUser.id);
    if (existing) { showToast("Share code: " + existing.shareCode, "info"); return existing.shareCode; }
    const code = currentUser.name.split(" ")[0].toUpperCase() + "-" + listingId.toUpperCase();
    const newRef = { id: "r" + Date.now(), promoterId: currentUser.id, listingId, shareCode: code, status: "pending", commissionAmount: 0, createdAt: new Date().toISOString().slice(0, 10) };
    setReferrals(prev => [...prev, newRef]);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, referrals: [...(u.referrals || []), listingId] } : u));
    showToast("Share link created! Code: " + code, "info");
    return code;
  };

  const removeListing = (listingId) => {
    setListings(prev => prev.filter(l => l.id !== listingId));
    showToast("Listing removed.");
  };

  const ctxUser = currentUser ? users.find(u => u.id === currentUser.id) : null;

  return (
    <div style={styles.app}>
      <style>{css}</style>
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <div style={styles.logo} onClick={() => setView("home")}>
            <span style={styles.logoIcon}>🚗</span>
            <span style={styles.logoText}>DriveLink</span>
          </div>
          <div style={styles.navLinks}>
            <NavBtn active={view === "home"} onClick={() => setView("home")}>Browse</NavBtn>
            {ctxUser?.role === "seller" && <NavBtn active={view === "myListings"} onClick={() => setView("myListings")}>My Listings</NavBtn>}
            {ctxUser?.role === "seller" && <NavBtn active={view === "postListing"} onClick={() => setView("postListing")}>+ Post Car</NavBtn>}
            {ctxUser?.role === "promoter" && <NavBtn active={view === "dashboard"} onClick={() => setView("dashboard")}>Earnings</NavBtn>}
            {ctxUser?.role === "admin" && <NavBtn active={view === "admin"} onClick={() => setView("admin")}>Admin</NavBtn>}
          </div>
          <div style={styles.navRight}>
            {ctxUser ? (
              <div style={styles.userChip}>
                <div style={styles.avatar}>{ctxUser.name[0]}</div>
                <div>
                  <div style={styles.userName}>{ctxUser.name}</div>
                  <div style={styles.userRole}>{ctxUser.role}</div>
                </div>
                {ctxUser.balance > 0 && <span style={styles.balanceBadge}>{fmt(ctxUser.balance)}</span>}
                <button style={styles.logoutBtn} onClick={logout}>Sign out</button>
              </div>
            ) : (
              <button style={styles.signInBtn} onClick={() => setView("login")}>Sign In</button>
            )}
          </div>
        </div>
      </nav>

      {toast && <div style={{ ...styles.toast, background: toast.type === "info" ? "#1d4ed8" : toast.type === "error" ? "#dc2626" : "#16a34a" }}>{toast.msg}</div>}

      {modal?.type === "buyNow" && (
        <div style={styles.overlay} onClick={() => setModal(null)}>
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Confirm Purchase</h3>
            <p style={styles.modalText}>You are purchasing <b>{modal.listing.year} {modal.listing.make} {modal.listing.model}</b> for <b>{fmt(modal.listing.price)}</b>.</p>
            <p style={styles.modalText}>Any referral commissions (1%) will be paid automatically.</p>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setModal(null)}>Cancel</button>
              <button style={styles.confirmBtn} onClick={() => markSold(modal.listing.id, modal.listing.price)}>Confirm Purchase</button>
            </div>
          </div>
        </div>
      )}

      <main style={styles.main}>
        {view === "login" && <LoginView users={users} onLogin={login} />}
        {view === "home" && <HomeView listings={activeListings} allListings={listings} currentUser={ctxUser} onShare={generateShare} onBuy={(l) => setModal({ type: "buyNow", listing: l })} referrals={referrals} />}
        {view === "myListings" && <MyListingsView listings={listings.filter(l => l.sellerId === ctxUser?.id)} referrals={referrals} users={users} />}
        {view === "postListing" && <PostListingView onPost={postListing} />}
        {view === "dashboard" && <PromoterDashboard currentUser={ctxUser} referrals={referrals.filter(r => r.promoterId === ctxUser?.id)} listings={listings} />}
        {view === "admin" && <AdminView listings={listings} users={users} referrals={referrals} onRemove={removeListing} />}
      </main>
    </div>
  );
}

function NavBtn({ children, active, onClick }) {
  return <button style={{ ...styles.navBtn, ...(active ? styles.navBtnActive : {}) }} onClick={onClick}>{children}</button>;
}

function LoginView({ users, onLogin }) {
  const [selected, setSelected] = useState("");
  return (
    <div style={styles.centered}>
      <div style={styles.loginCard}>
        <div style={styles.loginHeader}>
          <span style={{ fontSize: 40 }}>🚗</span>
          <h2 style={styles.loginTitle}>Sign in to DriveLink</h2>
          <p style={styles.loginSub}>Select a demo account to explore the platform</p>
        </div>
        <div style={styles.roleGrid}>
          {users.map(u => (
            <button key={u.id} style={{ ...styles.roleCard, ...(selected === u.id ? styles.roleCardActive : {}) }} onClick={() => setSelected(u.id)}>
              <div style={styles.roleAvatar}>{u.name[0]}</div>
              <div style={styles.roleName}>{u.name}</div>
              <div style={styles.roleTag}>{u.role}</div>
            </button>
          ))}
        </div>
        <button style={{ ...styles.confirmBtn, width: "100%", marginTop: 24, opacity: selected ? 1 : 0.4 }} disabled={!selected} onClick={() => onLogin(selected)}>
          Continue as {users.find(u => u.id === selected)?.name || "…"}
        </button>
      </div>
    </div>
  );
}

function HomeView({ listings, allListings, currentUser, onShare, onBuy, referrals }) {
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState(200000);
  const [sort, setSort] = useState("newest");

  const filtered = listings
    .filter(l => `${l.year} ${l.make} ${l.model}`.toLowerCase().includes(search.toLowerCase()))
    .filter(l => l.price <= maxPrice)
    .sort((a, b) => sort === "newest" ? new Date(b.createdAt) - new Date(a.createdAt) : sort === "priceLow" ? a.price - b.price : b.price - a.price);

  const soldCount = allListings.filter(l => l.status === "sold").length;

  return (
    <div>
      <div style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroBadge}>Peer-to-peer • Commission-backed</div>
          <h1 style={styles.heroTitle}>Find your next car.<br /><span style={styles.heroAccent}>Share and earn 1%.</span></h1>
          <p style={styles.heroSub}>Buy directly from owners. Promote listings to your network and earn 1% of every sale you unlock.</p>
          <div style={styles.heroStats}>
            <div style={styles.heroStat}><span style={styles.heroStatNum}>{listings.length}</span><span style={styles.heroStatLabel}>Active listings</span></div>
            <div style={styles.heroStatDiv} />
            <div style={styles.heroStat}><span style={styles.heroStatNum}>{soldCount}</span><span style={styles.heroStatLabel}>Cars sold</span></div>
            <div style={styles.heroStatDiv} />
            <div style={styles.heroStat}><span style={styles.heroStatNum}>1%</span><span style={styles.heroStatLabel}>Promoter cut</span></div>
          </div>
        </div>
      </div>
      <div style={styles.filterBar}>
        <input style={styles.searchInput} placeholder="Search make, model, year…" value={search} onChange={e => setSearch(e.target.value)} />
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Max price: {fmt(maxPrice)}</label>
          <input type="range" min={5000} max={200000} step={1000} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} style={styles.rangeInput} />
        </div>
        <select style={styles.selectInput} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="priceLow">Price: low to high</option>
          <option value="priceHigh">Price: high to low</option>
        </select>
      </div>
      <div style={styles.grid}>
        {filtered.length === 0 && <p style={{ gridColumn: "1/-1", color: "#6b7280", textAlign: "center", padding: 40 }}>No listings match your filters.</p>}
        {filtered.map(l => {
          const myRef = currentUser?.role === "promoter" ? referrals.find(r => r.listingId === l.id && r.promoterId === currentUser.id) : null;
          return <CarCard key={l.id} listing={l} currentUser={currentUser} onShare={onShare} onBuy={onBuy} myRef={myRef} />;
        })}
      </div>
    </div>
  );
}

function CarCard({ listing, currentUser, onShare, onBuy, myRef }) {
  const [copied, setCopied] = useState(false);
  const handleShare = () => {
    onShare(listing.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={styles.card} className="car-card">
      <div style={styles.cardImgWrap}>
        <img src={listing.image} alt={`${listing.make} ${listing.model}`} style={styles.cardImg} onError={e => { e.target.src = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80"; }} />
        <div style={styles.cardPrice}>{fmt(listing.price)}</div>
      </div>
      <div style={styles.cardBody}>
        <div style={styles.cardTitle}>{listing.year} {listing.make} {listing.model}</div>
        <div style={styles.cardMeta}>
          <span>🛣 {listing.mileage.toLocaleString()} mi</span>
          <span>🎨 {listing.color}</span>
        </div>
        <p style={styles.cardDesc}>{listing.description}</p>
        {myRef && (
          <div style={styles.refTag}>
            {myRef.status === "paid" ? `✅ Commission paid: ${fmt(myRef.commissionAmount)}` : `🔗 Tracking active • Code: ${myRef.shareCode}`}
          </div>
        )}
        <div style={styles.cardActions}>
          {currentUser?.role === "buyer" && <button style={styles.buyBtn} onClick={() => onBuy(listing)}>Buy Now</button>}
          {currentUser?.role === "promoter" && (
            <button style={{ ...styles.shareBtn, background: copied ? "#16a34a" : "#1d4ed8" }} onClick={handleShare}>
              {copied ? "✓ Copied!" : myRef ? "Share Again" : "Share & Earn 1%"}
            </button>
          )}
          {!currentUser && <span style={styles.loginPrompt}>Sign in to buy or share</span>}
        </div>
      </div>
    </div>
  );
}

function MyListingsView({ listings, referrals, users }) {
  return (
    <div style={styles.pageWrap}>
      <h2 style={styles.pageTitle}>My Listings</h2>
      {listings.length === 0 && <p style={{ color: "#6b7280" }}>You haven't posted any listings yet.</p>}
      <div style={styles.tableWrap}>
        {listings.map(l => {
          const ref = referrals.find(r => r.listingId === l.id);
          const promoter = ref ? users.find(u => u.id === ref.promoterId) : null;
          return (
            <div key={l.id} style={styles.listingRow}>
              <img src={l.image} alt="" style={styles.rowImg} onError={e => { e.target.src = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=300&q=60"; }} />
              <div style={styles.rowInfo}>
                <div style={styles.rowTitle}>{l.year} {l.make} {l.model}</div>
                <div style={styles.rowMeta}>{fmt(l.price)} • {l.mileage.toLocaleString()} mi</div>
                {l.status === "sold" && <div style={styles.soldBadge}>SOLD for {fmt(l.salePrice)} on {l.soldAt}</div>}
                {promoter && <div style={styles.promoterTag}>Promoted by {promoter.name} {ref.status === "paid" ? `• Commission ${fmt(ref.commissionAmount)} paid` : "• Pending"}</div>}
              </div>
              <span style={{ ...styles.statusPill, background: l.status === "active" ? "#dcfce7" : "#fee2e2", color: l.status === "active" ? "#15803d" : "#b91c1c" }}>{l.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PostListingView({ onPost }) {
  const [form, setForm] = useState({ make: "", model: "", year: new Date().getFullYear(), price: "", mileage: "", color: "", description: "", image: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = () => {
    if (!form.make || !form.model || !form.price) return alert("Fill in at least make, model, and price.");
    onPost({ ...form, price: +form.price, mileage: +form.mileage, year: +form.year, image: form.image || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80" });
  };
  return (
    <div style={styles.pageWrap}>
      <h2 style={styles.pageTitle}>Post a Car for Sale</h2>
      <div style={styles.formCard}>
        <div style={styles.formGrid}>
          <Field label="Make" value={form.make} onChange={v => set("make", v)} placeholder="e.g. Toyota" />
          <Field label="Model" value={form.model} onChange={v => set("model", v)} placeholder="e.g. Camry" />
          <Field label="Year" value={form.year} onChange={v => set("year", v)} type="number" />
          <Field label="Price ($)" value={form.price} onChange={v => set("price", v)} type="number" placeholder="e.g. 25000" />
          <Field label="Mileage" value={form.mileage} onChange={v => set("mileage", v)} type="number" placeholder="e.g. 35000" />
          <Field label="Color" value={form.color} onChange={v => set("color", v)} placeholder="e.g. Pearl White" />
        </div>
        <Field label="Image URL (optional)" value={form.image} onChange={v => set("image", v)} placeholder="https://…" />
        <div style={{ marginTop: 16 }}>
          <label style={styles.fieldLabel}>Description</label>
          <textarea style={styles.textarea} value={form.description} onChange={e => set("description", e.target.value)} rows={4} placeholder="Describe the car's condition, features, history…" />
        </div>
        <button style={{ ...styles.confirmBtn, marginTop: 24 }} onClick={handleSubmit}>Post Listing</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={styles.fieldLabel}>{label}</label>
      <input style={styles.fieldInput} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function PromoterDashboard({ currentUser, referrals, listings }) {
  const pending = referrals.filter(r => r.status === "pending");
  return (
    <div style={styles.pageWrap}>
      <h2 style={styles.pageTitle}>Earnings Dashboard</h2>
      <div style={styles.statsRow}>
        <StatBox label="Total Earned" value={fmt(currentUser?.balance || 0)} color="#16a34a" />
        <StatBox label="Shares Active" value={pending.length} color="#1d4ed8" />
        <StatBox label="Sales Converted" value={referrals.filter(r => r.status === "paid").length} color="#7c3aed" />
      </div>
      <h3 style={styles.sectionTitle}>Your Referrals</h3>
      {referrals.length === 0 && <p style={{ color: "#6b7280" }}>No referrals yet. Browse listings and share to earn 1% commission on sales.</p>}
      <div style={styles.tableWrap}>
        {referrals.map(r => {
          const listing = listings.find(l => l.id === r.listingId);
          return (
            <div key={r.id} style={styles.listingRow}>
              <div style={styles.rowInfo}>
                <div style={styles.rowTitle}>{listing ? `${listing.year} ${listing.make} ${listing.model}` : "Unknown listing"}</div>
                <div style={styles.rowMeta}>Share code: <b>{r.shareCode}</b> • Shared {r.createdAt}</div>
                {r.status === "paid" && <div style={styles.soldBadge}>✅ Commission earned: {fmt(r.commissionAmount)} on {r.paidAt}</div>}
                {r.status === "pending" && <div style={styles.promoterTag}>⏳ Pending sale — you'll earn {listing ? fmt(Math.round(listing.price * 0.01)) : "1%"} when it sells</div>}
              </div>
              <span style={{ ...styles.statusPill, background: r.status === "paid" ? "#dcfce7" : "#fef9c3", color: r.status === "paid" ? "#15803d" : "#854d0e" }}>{r.status}</span>
            </div>
          );
        })}
      </div>
      <div style={styles.infoBox}>
        <b>How commissions work:</b> When you share a listing and a buyer completes the purchase, 1% of the sale price is automatically credited to your account.
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={styles.statBox}>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function AdminView({ listings, users, referrals, onRemove }) {
  const [tab, setTab] = useState("listings");
  const totalRevenue = listings.filter(l => l.status === "sold").reduce((s, l) => s + l.salePrice, 0);
  const totalCommissions = referrals.filter(r => r.status === "paid").reduce((s, r) => s + r.commissionAmount, 0);
  return (
    <div style={styles.pageWrap}>
      <h2 style={styles.pageTitle}>Admin Panel</h2>
      <div style={styles.statsRow}>
        <StatBox label="Total Listings" value={listings.length} color="#1d4ed8" />
        <StatBox label="Active" value={listings.filter(l => l.status === "active").length} color="#16a34a" />
        <StatBox label="Sold" value={listings.filter(l => l.status === "sold").length} color="#7c3aed" />
        <StatBox label="GMV" value={fmt(totalRevenue)} color="#b45309" />
        <StatBox label="Commissions Paid" value={fmt(totalCommissions)} color="#dc2626" />
      </div>
      <div style={styles.tabRow}>
        {["listings", "users", "referrals"].map(t => (
          <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>
      {tab === "listings" && (
        <div style={styles.tableWrap}>
          {listings.map(l => (
            <div key={l.id} style={styles.listingRow}>
              <img src={l.image} alt="" style={styles.rowImg} onError={e => { e.target.src = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=300&q=60"; }} />
              <div style={styles.rowInfo}>
                <div style={styles.rowTitle}>{l.year} {l.make} {l.model}</div>
                <div style={styles.rowMeta}>{fmt(l.price)} • Seller: {l.sellerId}</div>
              </div>
              <span style={{ ...styles.statusPill, background: l.status === "active" ? "#dcfce7" : "#fee2e2", color: l.status === "active" ? "#15803d" : "#b91c1c" }}>{l.status}</span>
              {l.status === "active" && <button style={styles.removeBtn} onClick={() => onRemove(l.id)}>Remove</button>}
            </div>
          ))}
        </div>
      )}
      {tab === "users" && (
        <div style={styles.tableWrap}>
          {users.map(u => (
            <div key={u.id} style={styles.listingRow}>
              <div style={styles.avatar}>{u.name[0]}</div>
              <div style={styles.rowInfo}>
                <div style={styles.rowTitle}>{u.name}</div>
                <div style={styles.rowMeta}>{u.email} • Balance: {fmt(u.balance || 0)}</div>
              </div>
              <span style={{ ...styles.statusPill, background: "#e0e7ff", color: "#3730a3" }}>{u.role}</span>
            </div>
          ))}
        </div>
      )}
      {tab === "referrals" && (
        <div style={styles.tableWrap}>
          {referrals.length === 0 && <p style={{ color: "#6b7280" }}>No referrals yet.</p>}
          {referrals.map(r => {
            const promoter = users.find(u => u.id === r.promoterId);
            const listing = listings.find(l => l.id === r.listingId);
            return (
              <div key={r.id} style={styles.listingRow}>
                <div style={styles.rowInfo}>
                  <div style={styles.rowTitle}>{promoter?.name} → {listing ? `${listing.make} ${listing.model}` : r.listingId}</div>
                  <div style={styles.rowMeta}>Code: {r.shareCode} • Commission: {fmt(r.commissionAmount)}</div>
                </div>
                <span style={{ ...styles.statusPill, background: r.status === "paid" ? "#dcfce7" : "#fef9c3", color: r.status === "paid" ? "#15803d" : "#854d0e" }}>{r.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  app: { fontFamily: "'Inter', system-ui, sans-serif", background: "#f8fafc", minHeight: "100vh", color: "#111827" },
  nav: { background: "#fff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 24 },
  logo: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 },
  logoIcon: { fontSize: 22 },
  logoText: { fontWeight: 800, fontSize: 20, color: "#0f172a", letterSpacing: "-0.03em" },
  navLinks: { display: "flex", gap: 4, flex: 1 },
  navBtn: { background: "none", border: "none", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#4b5563" },
  navBtnActive: { background: "#f1f5f9", color: "#0f172a" },
  navRight: { marginLeft: "auto" },
  userChip: { display: "flex", alignItems: "center", gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 },
  userName: { fontSize: 13, fontWeight: 600, color: "#0f172a" },
  userRole: { fontSize: 11, color: "#6b7280", textTransform: "capitalize" },
  balanceBadge: { background: "#dcfce7", color: "#15803d", fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 20 },
  logoutBtn: { background: "none", border: "1px solid #e5e7eb", padding: "5px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#4b5563" },
  signInBtn: { background: "#0f172a", color: "#fff", border: "none", padding: "9px 20px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  main: { maxWidth: 1200, margin: "0 auto", padding: "0 24px 64px" },
  hero: { background: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)", margin: "0 -24px", padding: "72px 24px" },
  heroInner: { maxWidth: 680 },
  heroBadge: { display: "inline-block", background: "rgba(255,255,255,.12)", color: "#94a3b8", fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", padding: "5px 12px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontSize: 48, fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 16 },
  heroAccent: { color: "#60a5fa" },
  heroSub: { fontSize: 18, color: "#94a3b8", lineHeight: 1.6, marginBottom: 36, maxWidth: 520 },
  heroStats: { display: "flex", gap: 32, alignItems: "center" },
  heroStat: { display: "flex", flexDirection: "column", gap: 2 },
  heroStatNum: { fontSize: 28, fontWeight: 800, color: "#fff" },
  heroStatLabel: { fontSize: 13, color: "#64748b" },
  heroStatDiv: { width: 1, height: 40, background: "#334155" },
  filterBar: { display: "flex", gap: 16, alignItems: "center", padding: "24px 0 16px", flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", background: "#fff" },
  filterGroup: { display: "flex", flexDirection: "column", gap: 4, minWidth: 200 },
  filterLabel: { fontSize: 12, color: "#6b7280", fontWeight: 500 },
  rangeInput: { width: "100%", accentColor: "#3b82f6" },
  selectInput: { padding: "10px 14px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14, background: "#fff", cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 24, paddingTop: 8 },
  card: { background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.08)", transition: "transform .2s,box-shadow .2s" },
  cardImgWrap: { position: "relative", height: 200, overflow: "hidden" },
  cardImg: { width: "100%", height: "100%", objectFit: "cover" },
  cardPrice: { position: "absolute", bottom: 12, right: 12, background: "#0f172a", color: "#fff", fontWeight: 800, fontSize: 16, padding: "6px 14px", borderRadius: 10 },
  cardBody: { padding: "18px 20px 20px" },
  cardTitle: { fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 },
  cardMeta: { display: "flex", gap: 16, fontSize: 13, color: "#6b7280", marginBottom: 10 },
  cardDesc: { fontSize: 13, color: "#374151", lineHeight: 1.5, marginBottom: 14 },
  refTag: { background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 600, padding: "6px 10px", borderRadius: 8, marginBottom: 12 },
  cardActions: { display: "flex", gap: 10 },
  buyBtn: { flex: 1, background: "#0f172a", color: "#fff", border: "none", padding: "10px 0", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  shareBtn: { flex: 1, color: "#fff", border: "none", padding: "10px 0", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "background .3s" },
  loginPrompt: { fontSize: 13, color: "#9ca3af", fontStyle: "italic" },
  centered: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" },
  loginCard: { background: "#fff", borderRadius: 20, padding: 40, width: "100%", maxWidth: 500, boxShadow: "0 8px 40px rgba(0,0,0,.1)" },
  loginHeader: { textAlign: "center", marginBottom: 28 },
  loginTitle: { fontSize: 26, fontWeight: 800, color: "#0f172a", marginTop: 12 },
  loginSub: { fontSize: 14, color: "#6b7280", marginTop: 6 },
  roleGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  roleCard: { background: "#f8fafc", border: "2px solid #e5e7eb", borderRadius: 12, padding: "14px 12px", cursor: "pointer", textAlign: "center", transition: "all .15s" },
  roleCardActive: { border: "2px solid #3b82f6", background: "#eff6ff" },
  roleAvatar: { width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, margin: "0 auto 8px" },
  roleName: { fontSize: 13, fontWeight: 700, color: "#0f172a" },
  roleTag: { fontSize: 11, color: "#6b7280", textTransform: "capitalize", marginTop: 2 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" },
  modalBox: { background: "#fff", borderRadius: 20, padding: 32, maxWidth: 440, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,.2)" },
  modalTitle: { fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 12 },
  modalText: { fontSize: 14, color: "#374151", lineHeight: 1.6, marginBottom: 10 },
  modalActions: { display: "flex", gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, background: "#f1f5f9", border: "none", padding: "12px 0", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#374151" },
  confirmBtn: { flex: 1, background: "#0f172a", color: "#fff", border: "none", padding: "12px 0", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  pageWrap: { paddingTop: 36 },
  pageTitle: { fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 24, letterSpacing: "-0.02em" },
  tableWrap: { display: "flex", flexDirection: "column", gap: 12 },
  listingRow: { background: "#fff", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 4px rgba(0,0,0,.06)" },
  rowImg: { width: 80, height: 60, borderRadius: 8, objectFit: "cover", flexShrink: 0 },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: 700, color: "#0f172a" },
  rowMeta: { fontSize: 13, color: "#6b7280", marginTop: 3 },
  soldBadge: { display: "inline-block", background: "#dcfce7", color: "#15803d", fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 6, marginTop: 6 },
  promoterTag: { display: "inline-block", background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 6, marginTop: 6 },
  statusPill: { flexShrink: 0, fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20, textTransform: "uppercase", letterSpacing: ".04em" },
  removeBtn: { background: "#fee2e2", color: "#dc2626", border: "none", padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 },
  formCard: { background: "#fff", borderRadius: 16, padding: 32, maxWidth: 640, boxShadow: "0 1px 4px rgba(0,0,0,.07)" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  fieldLabel: { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" },
  fieldInput: { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" },
  statsRow: { display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" },
  statBox: { background: "#fff", borderRadius: 14, padding: "20px 24px", minWidth: 130, flex: 1, boxShadow: "0 1px 4px rgba(0,0,0,.06)" },
  statValue: { fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" },
  statLabel: { fontSize: 12, color: "#6b7280", fontWeight: 500, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 16 },
  infoBox: { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "16px 20px", fontSize: 13, color: "#1e40af", lineHeight: 1.6, marginTop: 24 },
  tabRow: { display: "flex", gap: 4, marginBottom: 20 },
  tab: { padding: "8px 18px", borderRadius: 8, border: "none", background: "none", fontSize: 14, fontWeight: 500, color: "#6b7280", cursor: "pointer" },
  tabActive: { background: "#f1f5f9", color: "#0f172a", fontWeight: 700 },
  toast: { position: "fixed", bottom: 24, right: 24, zIndex: 9999, color: "#fff", fontWeight: 600, fontSize: 14, padding: "14px 20px", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.2)", maxWidth: 360 },
};

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f8fafc; }
  .car-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.12) !important; }
  input:focus, select:focus, textarea:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,.15); }
  button:active { opacity: .85; }
`;
