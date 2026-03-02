import { useEffect, useState, useMemo, useRef } from "react";
import { api } from "../../apis";

/* ========================= TYPES ========================= */

export interface Plan {
    id: string;
    title: string;
    price: string;
    oldPrice: string;
    discount?: string;
    type?: string;
    premiumDurationDays: number;
}

export interface TopUpPack {
    id: string;
    coins?: number;
    bonus?: number;
    price: number;
    type?: string;
    tag?: string;
}

/* ========================= DATA ========================= */


export const firstPlan: Plan[] = [
    {
        id: "daily",
        title: "1 Ngày",
        price: "5000",
        oldPrice: "0",
        type: "one",
        discount: "Trải nghiệm",

        premiumDurationDays: 1,
    },

    {
        id: "weekly",
        title: "7 Ngày",
        price: "14000",
        oldPrice: "0",
        type: "common",
        premiumDurationDays: 7,
        discount: "Dùng thử"
    },
    {
        id: "monthly_first",
        title: "30 Ngày",
        price: "24000",
        oldPrice: "60000", // giá gốc 60.000
        type: "normal",
        premiumDurationDays: 30,
        discount: "Chọn nhiều",
    },
    {
        id: "quarter_first",
        title: "3 Tháng",
        price: "69000",
        oldPrice: "180000", // giá gốc 180.000
        premiumDurationDays: 90,
        type: "rare",
        discount: "Siêu hời",
    },
    {
        id: "halfyear_first",
        title: "6 Tháng",
        price: "129000",
        oldPrice: "360000",
        premiumDurationDays: 180,
        type: "epic",
        discount: "Đại Thần",
    },
    {
        id: "yearly_first",
        title: "12 Tháng",
        price: "229000",
        oldPrice: "730000", // sửa từ 360 -> 730.000 đúng giá gốc
        premiumDurationDays: 365,
        type: "legend",
        discount: "Sập Sàn",
    },
];

export const packs: TopUpPack[] = [
    { id: "tiny", coins: 200, price: 20000, type: "tiny" }, // 200 * 100
    {
        id: "small",
        coins: 500,
        bonus: 50,
        price: 50000,
        type: "small",
        tag: "Lựa chọn nhiều nhất",
    }, // 500 * 100
    { id: "medium", coins: 1000, bonus: 100, price: 100000, type: "medium" }, // 1000 * 100
    {
        id: "large",
        coins: 2000,
        bonus: 200,
        price: 200000,
        type: "large",
        tag: "Best deal!",
    }, // 2000 * 100
    { id: "extra", coins: 5000, bonus: 500, price: 500000, type: "extra" }, // 5000 * 100
];

/* ========================= COMPONENT ========================= */

export default function App() {
    const [emails, setEmails] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedEmail, setSelectedEmail] = useState("");

    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [selectedPack, setSelectedPack] = useState<TopUpPack | null>(null);

    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    /* ================= FETCH EMAIL ================= */

    useEffect(() => {
        const fetchEmails = async () => {
            try {
                const res = await api.get("/admin/get-user-email");
                setEmails(res.data.emails);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchEmails();
    }, []);

    const filteredEmails = useMemo(() => {
        return emails.filter((e) =>
            e.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, emails]);

    /* ============== CLICK OUTSIDE CLOSE ============== */

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    /* ================= HANDLE SUBMIT ================= */

    const handleSubmit = async () => {
        if (!selectedEmail) return alert("Chưa chọn user!");
        if (!selectedPlan && !selectedPack)
            return alert("Chưa chọn gói!");

        let payload;

        if (selectedPlan) {
            payload = {
                email: selectedEmail,
                type: "membership",
                packId: selectedPlan.id,
            };
        } else {
            payload = {
                email: selectedEmail,
                type: "coin",
                packId: selectedPack!.id,
            };
        }

        console.log("Submit payload:", payload);

        try {
            await api.post("/admin/create-membership", payload);
            alert("Xử lý thành công!");
        } catch (err) {
            console.error(err);
            alert("Có lỗi xảy ra!");
        }
    };

    /* ================= UI ================= */

    return (
        <div style={styles.container}>
            <div style={styles.card} ref={wrapperRef}>
                <h2 style={styles.title}>Admin Payment Tool</h2>

                {/* EMAIL SEARCH */}
                <label style={styles.label}>Chọn User</label>
                <input
                    type="text"
                    placeholder="Search email..."
                    value={search}
                    onFocus={() => setShowDropdown(true)}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setShowDropdown(true);
                    }}
                    style={styles.input}
                />

                {loading && <p>Loading...</p>}

                {showDropdown && search && (
                    <div style={styles.dropdown}>
                        {filteredEmails.slice(0, 8).map((email, i) => (
                            <div
                                key={i}
                                style={styles.option}
                                onClick={() => {
                                    setSelectedEmail(email);
                                    setSearch(email);
                                    setShowDropdown(false);
                                }}
                            >
                                {email}
                            </div>
                        ))}
                    </div>
                )}

                {/* PLAN */}
                <label style={styles.label}>Chọn Gói Premium</label>
                <div style={styles.grid}>
                    {firstPlan.map((plan) => (
                        <div
                            key={plan.id}
                            style={{
                                ...styles.item,
                                border:
                                    selectedPlan?.id === plan.id
                                        ? "2px solid #3b82f6"
                                        : "1px solid #ddd",
                            }}
                            onClick={() => {
                                setSelectedPlan(plan);
                                setSelectedPack(null);
                            }}
                        >
                            <strong>{plan.title}</strong>
                            <p>{plan.price}đ</p>
                        </div>
                    ))}
                </div>

                {/* PACK */}
                <label style={styles.label}>Hoặc Nạp Xu</label>
                <div style={styles.grid}>
                    {packs.map((pack) => (
                        <div
                            key={pack.id}
                            style={{
                                ...styles.item,
                                border:
                                    selectedPack?.id === pack.id
                                        ? "2px solid #10b981"
                                        : "1px solid #ddd",
                            }}
                            onClick={() => {
                                setSelectedPack(pack);
                                setSelectedPlan(null);
                            }}
                        >
                            <strong>{pack.coins} xu</strong>
                            <p>{pack.price.toLocaleString()}đ</p>
                        </div>
                    ))}
                </div>

                {/* BUTTON */}
                <button
                    style={{
                        ...styles.button,
                        opacity:
                            selectedEmail && (selectedPlan || selectedPack)
                                ? 1
                                : 0.5,
                        cursor:
                            selectedEmail && (selectedPlan || selectedPack)
                                ? "pointer"
                                : "not-allowed",
                    }}
                    disabled={
                        !selectedEmail || (!selectedPlan && !selectedPack)
                    }
                    onClick={handleSubmit}
                >
                    Xử Lý
                </button>
            </div>
        </div>
    );
}

/* ========================= STYLES ========================= */

const styles: any = {
    container: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg,#eef2ff,#f0fdf4)",
    },
    card: {
        width: "500px",
        padding: "30px",
        borderRadius: "16px",
        background: "white",
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        position: "relative",
    },
    title: {
        marginBottom: "20px",
        textAlign: "center",
    },
    label: {
        marginTop: "15px",
        marginBottom: "6px",
        display: "block",
        fontWeight: 600,
    },
    input: {
        width: "100%",
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #ccc",
    },
    dropdown: {
        position: "absolute",
        background: "white",
        width: "calc(100% - 60px)",
        maxHeight: "180px",
        overflowY: "auto",
        border: "1px solid #ddd",
        borderRadius: "8px",
        marginTop: "5px",
        zIndex: 10,
    },
    option: {
        padding: "8px",
        cursor: "pointer",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: "10px",
    },
    item: {
        padding: "12px",
        borderRadius: "10px",
        cursor: "pointer",
        textAlign: "center",
        transition: "0.2s",
    },
    button: {
        marginTop: "25px",
        width: "100%",
        padding: "12px",
        borderRadius: "10px",
        border: "none",
        background: "#3b82f6",
        color: "white",
        fontWeight: 600,
        fontSize: "16px",
    },
};
