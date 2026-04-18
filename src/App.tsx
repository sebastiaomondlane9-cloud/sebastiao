/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, ChangeEvent, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { io, Socket } from "socket.io-client";
import { 
  Gamepad2, 
  Plus, 
  Search, 
  User, 
  LogOut, 
  ShoppingBag, 
  TrendingUp, 
  ShieldCheck,
  Zap,
  Eye,
  Filter,
  Image as ImageIcon,
  Tag,
  DollarSign,
  MessageSquare,
  Send,
  X,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Package,
  Activity,
  CreditCard,
  Smartphone,
  Coins,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

// --- Types ---
interface Transaction {
  id: number;
  type: "purchase" | "sale";
  itemTitle: string;
  amount: string;
  date: string;
  status: "completed" | "pending" | "Aguardando Pagamento";
  counterparty: string;
  id_display: string;
}

interface Game {
  id: number;
  title: string;
  image: string;
  tags: string[];
}

interface Message {
  id: number;
  user: string;
  avatar: string;
  text: string;
  timestamp: string;
}

interface Post {
  id: number;
  title: string;
  price: string;
  image: string;
  seller: string;
  category: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
}

interface UserData {
  name: string;
  email: string;
  avatar: string;
  cover: string;
}

type SortOption = "newest" | "price-low" | "price-high" | "rarity";

const RARITY_ORDER = {
  "Legendary": 4,
  "Epic": 3,
  "Rare": 2,
  "Common": 1
};

// --- Mock Data ---
const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    title: "Conta Free Fire PRO",
    price: "1500 MT",
    image: "https://picsum.photos/seed/ffpro/400/300",
    seller: "vendedor1",
    category: "Accounts",
    rarity: "Epic"
  }
];

const POPULAR_GAMES = [
  { 
    id: 1, 
    name: "Free Fire", 
    image: "https://picsum.photos/seed/freefire_new/400/300" 
  },
  { 
    id: 2, 
    name: "PUBG", 
    image: "https://picsum.photos/seed/pubg_new/400/300" 
  },
  { 
    id: 3, 
    name: "Roblox", 
    image: "https://picsum.photos/seed/roblox_new/400/300" 
  },
  { 
    id: 4, 
    name: "Call of Duty", 
    image: "https://picsum.photos/seed/cod_new/400/300" 
  },
];

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("");
  const [cover, setCover] = useState("");
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 1,
      type: "sale",
      itemTitle: "Indian server ✨ Free fire max Normal accou...",
      amount: "20,12 MT",
      date: new Date(Date.now() - 86400000).toISOString(),
      status: "Aguardando Pagamento",
      counterparty: "comprador_elite@gmail.com",
      id_display: "#2682271"
    }
  ]);
  const [selectedPostForPurchase, setSelectedPostForPurchase] = useState<Post | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "emola" | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [quickViewPost, setQuickViewPost] = useState<Post | null>(null);
  const [activeView, setActiveView] = useState<"hub" | "marketplace" | "topup">("hub");
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  // Persistence logic
  useEffect(() => {
    const savedUser = localStorage.getItem("mozgame_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setActiveView("hub");
      } catch (e) {
        console.error("Error parsing saved user", e);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem("mozgame_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("mozgame_user");
    }
  }, [user]);

  // Marketplace State
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // New Ad State
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newCategory, setNewCategory] = useState("Accounts");

  const login = () => {
    if (!email || !password) return;
    const userData = { 
      name: email.split('@')[0],
      email, 
      avatar: avatar || "https://picsum.photos/seed/user/100/100",
      cover: cover || "https://picsum.photos/seed/cover/800/300"
    };
    setUser(userData);
    setActiveView("hub");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("mozgame_user");
    setActiveView("hub");
  };

  const openSite = () => {
    window.open('https://www.moztopup.com/', '_blank');
  };

  const uploadAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatar(URL.createObjectURL(file));
  };

  const uploadCover = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCover(URL.createObjectURL(file));
  };

  const handleAdImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setNewImage(URL.createObjectURL(file));
  };

  const addPost = () => {
    if (!newTitle || !newPrice || !user) return;
    const post: Post = {
      id: Date.now(),
      title: newTitle,
      price: `${newPrice} MT`,
      image: newImage || `https://picsum.photos/seed/${newTitle}/400/300`,
      seller: user.email,
      category: newCategory,
      rarity: "Common",
    };
    
    setPosts([post, ...posts]);
    setNewTitle("");
    setNewPrice("");
    setNewImage("");
    setIsAdModalOpen(false);
  };

  const handlePurchase = (post: Post) => {
    setSelectedPostForPurchase(post);
    setPaymentMethod(null);
    setPhoneNumber("");
    setPaymentSuccess(false);
  };

  const confirmPayment = () => {
    if (!paymentMethod || !phoneNumber) return;
    setIsProcessingPayment(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      
      if (selectedPostForPurchase && user) {
        const newTransaction: Transaction = {
          id: Date.now(),
          type: "purchase",
          itemTitle: selectedPostForPurchase.title,
          amount: selectedPostForPurchase.price,
          date: new Date().toISOString(),
          status: "completed",
          counterparty: selectedPostForPurchase.seller,
          id_display: `#${Math.floor(Math.random() * 9000000) + 1000000}`
        };
        setTransactions(prev => [newTransaction, ...prev]);
      }

      setTimeout(() => {
        setSelectedPostForPurchase(null);
      }, 2000);
    }, 2000);
  };

  const updateProfile = (newName: string, newAvatar: string, newCover: string) => {
    if (!user) return;
    setUser({ ...user, name: newName, avatar: newAvatar, cover: newCover });
    setIsProfileModalOpen(false);
  };

  const parsePrice = (priceStr: string) => {
    return parseFloat(priceStr.replace(/[^0-9]/g, ''));
  };

  const filteredAndSortedPosts = posts
    .filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "Todos" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return parsePrice(a.price) - parsePrice(b.price);
        case "price-high":
          return parsePrice(b.price) - parsePrice(a.price);
        case "rarity":
          return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
        case "newest":
        default:
          return b.id - a.id;
      }
    });

  useEffect(() => {
    if (user) {
      socketRef.current = io();

      socketRef.current.on("chat:message", (msg: Message) => {
        setChatMessages((prev) => [...prev, msg]);
      });

      socketRef.current.on("post:new", (post: Post) => {
        setPosts((prev) => [post, ...prev]);
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatOpen]);

  const sendMessage = () => {
    if (!chatInput.trim() || !user || !socketRef.current) return;

    const messageData = {
      user: user.name,
      avatar: user.avatar,
      text: chatInput,
    };

    socketRef.current.emit("chat:message", messageData);
    setChatInput("");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-4 font-sans selection:bg-cyan-500 selection:text-black">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#141414] border border-[#222] p-8 rounded-2xl w-full max-w-md space-y-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500" />
          
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20">
                <Gamepad2 className="w-8 h-8 text-cyan-500" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tighter">Mozgame.com</h1>
            <p className="text-gray-500 text-sm">A elite do comércio gamer em Moçambique</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Email</label>
              <input 
                className="w-full p-3 rounded-xl bg-[#1a1a1a] border border-[#333] focus:border-cyan-500 outline-none transition-all placeholder:text-gray-600" 
                placeholder="exemplo@mozgame.com" 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Senha</label>
              <input 
                type="password" 
                className="w-full p-3 rounded-xl bg-[#1a1a1a] border border-[#333] focus:border-cyan-500 outline-none transition-all placeholder:text-gray-600" 
                placeholder="••••••••" 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Avatar (Opcional)</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer bg-[#1a1a1a] border border-[#333] border-dashed p-3 rounded-xl hover:border-cyan-500 transition-all text-center text-sm text-gray-500">
                  <input type="file" className="hidden" onChange={uploadAvatar} />
                  {avatar ? "Avatar Selecionado" : "Escolher Avatar"}
                </label>
                {avatar && <img src={avatar} className="w-12 h-12 rounded-xl object-cover border border-[#333]" />}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Capa (Opcional)</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer bg-[#1a1a1a] border border-[#333] border-dashed p-3 rounded-xl hover:border-cyan-500 transition-all text-center text-sm text-gray-500">
                  <input type="file" className="hidden" onChange={uploadCover} />
                  {cover ? "Capa Selecionada" : "Escolher Capa"}
                </label>
                {cover && <img src={cover} className="w-12 h-12 rounded-xl object-cover border border-[#333]" />}
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold p-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              onClick={login}
            >
              Acessar Plataforma <Zap className="w-4 h-4 fill-current" />
            </motion.button>
          </div>

          <p className="text-center text-xs text-gray-600">
            Ao entrar você concorda com nossos termos de serviço.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white font-sans selection:bg-cyan-500 selection:text-black pb-20 lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#222] px-4 md:px-6 py-3 md:py-4 flex justify-between items-center h-16 md:h-20 shrink-0">
        <div className="flex items-center gap-4 md:gap-8">
          <div 
            className="flex items-center gap-2 shrink-0 cursor-pointer"
            onClick={() => setActiveView("hub")}
          >
            {activeView !== "hub" && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveView("hub");
                }}
                className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <Gamepad2 className="w-5 h-5 md:w-6 md:h-6 text-cyan-500" />
            <h1 className="text-lg md:text-xl font-bold tracking-tighter uppercase shrink-0">
              {activeView === "topup" ? "Mozgame Top-up" : "MOZGAME"}
            </h1>
          </div>
          
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-400">
            <button 
              onClick={() => setActiveView("hub")}
              className={`transition-colors flex items-center gap-1 ${activeView === "hub" ? "text-cyan-500" : "hover:text-white"}`}
            >
              Início
            </button>
            <button 
              onClick={() => setActiveView("marketplace")}
              className={`transition-colors flex items-center gap-1 ${activeView === "marketplace" ? "text-cyan-500" : "hover:text-white"}`}
            >
              Marketplace
            </button>
          </nav>

          {activeView === "marketplace" && (
            <div className="hidden md:flex items-center bg-[#141414] border border-[#222] rounded-full px-4 py-1.5 gap-2 w-64 lg:w-80 transition-all focus-within:border-cyan-500/50">
              <Search className="w-4 h-4 text-gray-500" />
              <input 
                className="bg-transparent outline-none text-sm w-full placeholder:text-gray-600" 
                placeholder="Buscar contas, skins, itens..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {activeView === "marketplace" && (
            <button 
              className="md:hidden p-2 text-gray-500 hover:text-cyan-500 transition-colors"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          <div className="hidden lg:flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" /> PT/MT
            </div>
          </div>

          <div className="h-6 w-[1px] bg-[#222] hidden sm:block" />

          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 p-2 md:p-0 text-gray-500 hover:text-cyan-500 transition-colors relative group"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-xs font-bold hidden xl:block">Meus Pedidos</span>
            {transactions.length > 0 && (
              <span className="absolute top-1 right-1 md:-top-1 md:-right-1 w-2 h-2 bg-cyan-500 rounded-full" />
            )}
          </button>

          <div className="flex items-center gap-3 bg-[#141414] border border-[#222] pl-1 pr-1 md:pr-4 py-1 rounded-full group relative">
            <img 
              src={user.avatar} 
              className="w-8 h-8 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-cyan-500/50 transition-all" 
              onClick={() => setIsProfileModalOpen(true)} 
            />
            <div className="hidden md:flex flex-col cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
              <span className="text-sm font-bold leading-tight">{user.name}</span>
              <span className="text-[10px] text-gray-500 leading-tight">{user.email.split('@')[0]}</span>
            </div>
            <div className="h-4 w-[1px] bg-[#333] hidden md:block mx-1" />
            <LogOut 
              className="w-4 h-4 text-gray-500 cursor-pointer hover:text-red-500 transition-colors ml-1 md:ml-0" 
              onClick={logout} 
            />
          </div>
        </div>

        {/* Mobile Search Overlay */}
        <AnimatePresence>
          {isMobileSearchOpen && activeView === "marketplace" && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="absolute top-full left-0 w-full bg-[#141414] border-b border-[#222] p-4 md:hidden overflow-hidden"
            >
              <div className="flex items-center bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-2 gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <input 
                  autoFocus
                  className="bg-transparent outline-none text-sm w-full" 
                  placeholder="Buscar..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        {activeView === "hub" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 h-full flex flex-col items-center justify-center pt-8 md:pt-16 pb-12">
            <div className="text-center space-y-4 mb-4 md:mb-12">
              <div className="bg-cyan-500/10 p-4 rounded-3xl border border-cyan-500/20 w-fit mx-auto mb-6">
                <Gamepad2 className="w-12 h-12 text-cyan-500 animate-pulse" />
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic">
                Painel <span className="text-cyan-500">Mozgame</span>
              </h2>
              <p className="text-gray-500 max-w-sm mx-auto text-sm md:text-base italic">Seja bem-vindo, {user.name}. O que vamos fazer hoje?</p>
            </div>

            <div className="flex flex-col items-center gap-6 md:gap-8 w-full max-w-xl px-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveView("marketplace")}
                className="relative h-56 md:h-80 w-full rounded-[2.5rem] overflow-hidden group border border-[#222] shadow-2xl hover:border-cyan-500/50 transition-all"
              >
                <img 
                  src="https://picsum.photos/seed/marketplace/600/400" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-40 grayscale group-hover:grayscale-0" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent flex flex-col justify-end p-8 text-left">
                  <div className="p-4 bg-cyan-500 w-fit rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/20">
                    <ShoppingBag className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tighter uppercase italic">Marketplace</h3>
                  <p className="text-xs md:text-sm text-gray-400 mt-2 font-medium opacity-80">Comércio de elite em Moçambique.</p>
                </div>
              </motion.button>
            </div>
            
            <div className="pt-8 w-full max-w-xs space-y-3">
              <button 
                onClick={logout}
                className="w-full bg-[#141414] border border-[#222] p-4 rounded-2xl text-xs text-gray-500 hover:text-red-500 transition-all font-bold uppercase tracking-widest flex items-center justify-center gap-2 group"
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Sair da Conta
              </button>
            </div>
          </div>
        )}

        {activeView === "marketplace" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
            {/* Hero Section */}
            <section className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border border-[#222] p-6 md:p-12">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full text-cyan-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">
              <TrendingUp className="w-3 h-3" /> Mercado em Alta
            </div>
            <h2 className="text-3xl md:text-6xl font-bold tracking-tight leading-tight">
              Onde as lendas <br /> <span className="text-cyan-500">negociam.</span>
            </h2>
            <p className="text-gray-400 text-base md:text-lg max-w-md">
              Compre e venda contas com segurança garantida pela Mozgame.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-300">
                <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-green-500" /> Verificação
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-300">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" /> Instantâneo
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none opacity-50 md:opacity-100" />
        </section>

        {/* Jogos Populares Section (Dynamic List) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight uppercase italic text-cyan-500">Jogos Populares</h3>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Lista Dinâmica</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {POPULAR_GAMES.map((game) => (
              <motion.div 
                key={game.id} 
                whileHover={{ scale: 1.05 }}
                className="bg-[#141414] border border-[#222] p-2 rounded-2xl group cursor-pointer transition-all hover:border-cyan-500/50" 
              >
                <div className="relative aspect-video overflow-hidden rounded-xl">
                  <img 
                    src={game.image} 
                    alt={game.name} 
                    className="w-full h-full object-cover transition-transform duration-500" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=Imagem+Indisponível";
                    }}
                  />
                </div>
                <p className="text-center mt-3 text-sm font-bold tracking-tight text-gray-300 group-hover:text-cyan-500 transition-colors">
                  {game.name}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="pt-8 border-t border-[#222]">
          <h3 className="text-2xl font-bold tracking-tighter mb-8">Chaves de Jogos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Existing Posts Grid */}
            <AnimatePresence mode="popLayout">
              {filteredAndSortedPosts.map((post) => (
                <motion.div 
                  key={post.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  className="group bg-[#141414] border border-[#222] rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all shadow-xl"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={post.image} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setQuickViewPost(post)}
                        className="bg-cyan-500 text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg"
                      >
                        <Eye className="w-4 h-4" /> Quick View
                      </motion.button>
                    </div>
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter ${
                        post.rarity === 'Legendary' ? 'bg-yellow-500 text-black' :
                        post.rarity === 'Epic' ? 'bg-purple-500 text-white' :
                        post.rarity === 'Rare' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
                      }`}>
                        {post.rarity}
                      </span>
                      <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter text-white">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="font-bold text-lg line-clamp-1 group-hover:text-cyan-500 transition-colors">{post.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-4 h-4 rounded-full bg-gray-700 overflow-hidden">
                          <img src={`https://picsum.photos/seed/${post.seller}/20/20`} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-xs text-gray-500 truncate">{post.seller}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#222]">
                      <div className="space-y-0.5">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Preço</p>
                        <p className="text-xl font-mono font-bold text-cyan-500">{post.price}</p>
                      </div>
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePurchase(post)}
                        className="bg-white text-black p-3 rounded-xl hover:bg-cyan-500 transition-colors"
                      >
                        <ShoppingBag className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>
    )}

    {activeView === "topup" && (
      <div className="fixed inset-0 top-[64px] md:top-[80px] bg-[#0a0a0a] z-40 flex flex-col animate-in fade-in slide-in-from-right-8 duration-700">
        <div className="flex-1 w-full bg-white relative">
          {isIframeLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-50">
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mb-4"
              />
              <p className="text-sm font-bold tracking-widest uppercase italic text-gray-500">Conectando ao MozTopUp...</p>
            </div>
          )}
          <iframe 
            src="https://www.moztopup.com/" 
            className="w-full h-full border-none"
            onLoad={() => setIsIframeLoading(false)}
            title="MozTopUp WebView"
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
          />
          
          {/* WebView Tooltip Overlay */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-6 right-6 left-6 md:left-auto md:w-80 bg-black/95 p-4 rounded-3xl border border-[#333] backdrop-blur-xl shadow-2xl flex items-center justify-between gap-4 z-[60]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-400 rounded-lg">
                <Smartphone className="w-4 h-4 text-black" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white uppercase tracking-tighter">Modo WebView Ativo</p>
                <p className="text-[9px] text-gray-500 font-medium">Site integrado com sucesso.</p>
              </div>
            </div>
            <button 
              onClick={openSite}
              className="bg-[#1a1a1a] text-white p-2 rounded-lg hover:bg-[#222] transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>
    )}
  </main>

      {/* Create Ad Modal */}
      <AnimatePresence>
        {isAdModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[#0a0a0a] sm:bg-[#141414] border-x sm:border border-[#222] p-6 md:p-8 rounded-none sm:rounded-3xl w-full max-w-lg h-full sm:h-auto overflow-y-auto no-scrollbar shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">Criar Novo Anúncio</h2>
                <button onClick={() => setIsAdModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                    <Tag className="w-3 h-3" /> Título do Anúncio
                  </label>
                  <input 
                    className="w-full p-3 rounded-xl bg-[#1a1a1a] border border-[#333] focus:border-cyan-500 outline-none transition-all" 
                    placeholder="Ex: Conta Free Fire Gemada" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                      <DollarSign className="w-3 h-3" /> Preço (MT)
                    </label>
                    <input 
                      type="number"
                      className="w-full p-3 rounded-xl bg-[#1a1a1a] border border-[#333] focus:border-cyan-500 outline-none transition-all" 
                      placeholder="1500" 
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                      <Filter className="w-3 h-3" /> Categoria
                    </label>
                    <select 
                      className="w-full p-3 rounded-xl bg-[#1a1a1a] border border-[#333] focus:border-cyan-500 outline-none transition-all appearance-none"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    >
                      <option>Accounts</option>
                      <option>Skins</option>
                      <option>Items</option>
                      <option>Currencies</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                    <ImageIcon className="w-3 h-3" /> Imagem do Anúncio
                  </label>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center justify-center w-full h-32 border-2 border-[#333] border-dashed rounded-xl cursor-pointer hover:border-cyan-500 transition-all overflow-hidden relative group">
                      {newImage ? (
                        <>
                          <img src={newImage} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-xs">Escolher imagem do dispositivo</span>
                        </div>
                      )}
                      <input type="file" className="hidden" onChange={handleAdImageUpload} accept="image/*" />
                    </label>
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-cyan-500 text-black font-bold p-4 rounded-xl transition-colors mt-4"
                  onClick={addPost}
                >
                  Publicar Anúncio
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction History Modal (GameBoost Style) */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 50 }}
              className="relative bg-[#0a0a0a] border-x border-t border-[#222] rounded-t-3xl md:rounded-3xl w-full max-w-6xl h-full md:h-[85vh] overflow-hidden flex flex-col shadow-2xl mt-12 md:mt-0"
            >
              {/* Modal Header */}
              <div className="p-6 md:p-8 border-b border-[#222] space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                      <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-cyan-500" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-3xl font-bold tracking-tighter">Meus Pedidos</h2>
                      <p className="text-gray-500 text-[10px] md:text-sm">Lista de todos os seus produtos e serviços.</p>
                    </div>
                  </div>
                  <button onClick={() => setIsHistoryOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                    <Plus className="w-6 h-6 md:w-8 md:h-8 rotate-45" />
                  </button>
                </div>

                {/* Sub-nav */}
                <div className="flex items-center overflow-x-auto gap-4 md:gap-8 border-b border-[#222] pb-1 no-scrollbar">
                  {["Pedidos", "Chat", "Carteira", "Biblioteca", "Configurações"].map((tab, i) => (
                    <button key={tab} className={`pb-3 text-xs md:text-sm font-bold transition-all relative whitespace-nowrap ${i === 0 ? "text-cyan-500" : "text-gray-500 hover:text-gray-300"}`}>
                      {tab}
                      {i === 0 && <motion.div layoutId="activeTabHistory" className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Content */}
              <div className="flex-1 overflow-auto p-6 md:p-8 no-scrollbar">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center bg-[#141414] border border-[#222] rounded-xl px-4 py-2 w-full md:max-w-sm">
                    <Search className="w-4 h-4 text-gray-500 mr-2" />
                    <input className="bg-transparent outline-none text-sm w-full placeholder:text-gray-600" placeholder="Search..." />
                  </div>
                  <div className="flex overflow-x-auto gap-2 no-scrollbar pb-2 md:pb-0">
                    <button className="px-4 py-2 bg-[#141414] border border-[#222] rounded-xl text-[10px] font-bold text-gray-400 hover:text-white whitespace-nowrap">+ Tipo</button>
                    <button className="px-4 py-2 bg-[#141414] border border-[#222] rounded-xl text-[10px] font-bold text-gray-400 hover:text-white whitespace-nowrap">+ Status</button>
                    <button className="px-4 py-2 bg-[#141414] border border-[#222] rounded-xl text-[10px] font-bold text-gray-400 hover:text-white whitespace-nowrap">+ Comprado Em</button>
                  </div>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest text-gray-500 font-bold border-b border-[#222]">
                        <th className="pb-4">Pedido</th>
                        <th className="pb-4">ID</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4">Preço</th>
                        <th className="pb-4">Moedas</th>
                        <th className="pb-4">Crédito</th>
                        <th className="pb-4">Atualização</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-[#222] hover:bg-white/5 transition-colors group">
                          <td className="py-6 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-800 overflow-hidden shrink-0">
                                <img src={`https://picsum.photos/seed/${tx.itemTitle}/40/40`} className="w-full h-full object-cover" />
                              </div>
                              <div className="max-w-[200px]">
                                <p className="font-bold truncate">{tx.itemTitle}</p>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Account Order</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-6 pr-4 font-mono text-gray-400">{tx.id_display}</td>
                          <td className="py-6 pr-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                              tx.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-400'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-6 pr-4 font-bold">{tx.amount}</td>
                          <td className="py-6 pr-4 text-gray-500">—</td>
                          <td className="py-6 pr-4 text-gray-500">—</td>
                          <td className="py-6 pr-4 text-gray-400 text-xs">
                            {new Date(tx.date).toLocaleDateString() === new Date().toLocaleDateString() ? "today" : "a day ago"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {transactions.length === 0 && (
                  <div className="py-20 text-center space-y-4">
                    <Clock className="w-12 h-12 text-gray-700 mx-auto" />
                    <p className="text-gray-500">Nenhum pedido encontrado.</p>
                  </div>
                )}
              </div>

              {/* Pagination Footer */}
              <div className="p-6 border-t border-[#222] bg-[#0a0a0a] flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span>Rows per page</span>
                  <select className="bg-[#141414] border border-[#222] rounded px-2 py-1 outline-none">
                    <option>15</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <span>1 linhas - Página 1 de 1</span>
                  <div className="flex gap-1">
                    <button className="p-1 hover:text-white transition-colors"><Plus className="w-4 h-4 rotate-45" /></button>
                    <button className="p-1 hover:text-white transition-colors"><Plus className="w-4 h-4 rotate-45" /></button>
                    <button className="bg-cyan-500 text-black px-2 py-1 rounded font-bold">1</button>
                    <button className="p-1 hover:text-white transition-colors"><Plus className="w-4 h-4 rotate-45" /></button>
                    <button className="p-1 hover:text-white transition-colors"><Plus className="w-4 h-4 rotate-45" /></button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Modal (Facebook Style) */}
      <AnimatePresence>
        {isProfileModalOpen && user && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 50 }}
              className="relative bg-[#0a0a0a] border border-[#222] rounded-none md:rounded-3xl w-full max-w-4xl h-full md:h-[90vh] overflow-y-auto no-scrollbar shadow-2xl flex flex-col"
            >
              {/* Cover Photo */}
              <div className="relative h-48 md:h-64 bg-[#1a1a1a] shrink-0">
                <img src={cover || user.cover} className="w-full h-full object-cover" />
                <label className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 p-2 rounded-lg cursor-pointer transition-colors flex items-center gap-2 text-xs font-bold border border-white/10">
                  <ImageIcon className="w-4 h-4" /> Alterar Capa
                  <input type="file" className="hidden" onChange={uploadCover} />
                </label>
                
                {/* Profile Picture Overlap */}
                <div className="absolute -bottom-20 md:-bottom-16 left-1/2 md:left-8 -translate-x-1/2 md:translate-x-0 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
                  <div className="relative group">
                    <img src={avatar || user.avatar} className="w-28 h-28 md:w-40 md:h-40 rounded-full object-cover border-4 border-[#0a0a0a] bg-[#0a0a0a] shadow-2xl" />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <ImageIcon className="w-6 h-6 text-white" />
                      <input type="file" className="hidden" onChange={uploadAvatar} />
                    </label>
                  </div>
                  <div className="mb-0 md:mb-4 space-y-1 text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{user.name}</h2>
                    <p className="text-gray-500 text-xs md:text-sm">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Profile Content */}
              <div className="mt-24 md:mt-20 px-4 md:px-8 pb-8 space-y-8">
                {/* Actions Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-4 border-b border-[#222]">
                  <div className="flex overflow-x-auto gap-4 md:gap-4 no-scrollbar">
                    <button className="px-4 md:px-6 py-2 bg-cyan-500 text-black font-bold rounded-lg text-xs md:text-sm whitespace-nowrap">
                      Publicações
                    </button>
                    <button className="px-4 md:px-6 py-2 bg-[#1a1a1a] text-gray-400 font-bold rounded-lg text-xs md:text-sm hover:text-white transition-colors whitespace-nowrap">
                      Sobre
                    </button>
                    <button className="px-4 md:px-6 py-2 bg-[#1a1a1a] text-gray-400 font-bold rounded-lg text-xs md:text-sm hover:text-white transition-colors whitespace-nowrap">
                      Amigos
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsAdModalOpen(true)}
                      className="flex-1 lg:flex-none px-4 md:px-6 py-2 bg-white text-black font-bold rounded-lg text-xs md:text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Anunciar
                    </button>
                    <button 
                      onClick={() => {
                        const nameInput = document.getElementById('fb-profile-name') as HTMLInputElement;
                        updateProfile(nameInput.value || user.name, avatar || user.avatar, cover || user.cover);
                      }}
                      className="flex-1 lg:flex-none px-4 md:px-6 py-2 bg-[#1a1a1a] border border-[#333] text-white font-bold rounded-lg text-xs md:text-sm hover:border-cyan-500 transition-colors"
                    >
                      Salvar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Sidebar - Info */}
                  <div className="space-y-6">
                    <div className="bg-[#141414] border border-[#222] p-6 rounded-2xl space-y-4">
                      <h3 className="font-bold text-lg">Apresentação</h3>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Nome de Exibição</label>
                          <input 
                            id="fb-profile-name"
                            className="w-full bg-[#0a0a0a] border border-[#222] p-2 rounded-lg text-sm outline-none focus:border-cyan-500"
                            defaultValue={user.name}
                          />
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <ShieldCheck className="w-4 h-4 text-cyan-500" />
                          <span>Vendedor Verificado</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span>Membro desde 2026</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Feed - User's Posts */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">Minhas Publicações</h3>
                      <span className="text-xs text-gray-500">{posts.filter(p => p.seller === user.email).length} anúncios ativos</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {posts.filter(p => p.seller === user.email).length === 0 ? (
                        <div className="col-span-full py-12 text-center bg-[#141414] border border-[#222] border-dashed rounded-2xl space-y-4">
                          <p className="text-gray-500">Você ainda não tem anúncios ativos.</p>
                          <button 
                            onClick={() => setIsAdModalOpen(true)}
                            className="text-cyan-500 font-bold text-sm hover:underline"
                          >
                            Comece a vender agora
                          </button>
                        </div>
                      ) : (
                        posts.filter(p => p.seller === user.email).map((post) => (
                          <div key={post.id} className="bg-[#141414] border border-[#222] rounded-xl overflow-hidden flex flex-col">
                            <img src={post.image} className="h-32 w-full object-cover" />
                            <div className="p-4 space-y-2">
                              <h4 className="font-bold text-sm truncate">{post.title}</h4>
                              <div className="flex justify-between items-center">
                                <span className="text-cyan-500 font-bold text-sm">{post.price}</span>
                                <span className="text-[10px] bg-[#222] px-2 py-1 rounded uppercase font-bold text-gray-400">{post.category}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewPost && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickViewPost(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[#0a0a0a] sm:bg-[#141414] border-x border-t sm:border border-[#222] rounded-t-3xl sm:rounded-3xl w-full max-w-2xl overflow-y-auto sm:overflow-hidden shadow-2xl flex flex-col md:flex-row h-full sm:h-auto mt-12 sm:mt-0"
            >
              <div className="w-full md:w-1/2 h-64 md:h-auto shrink-0">
                <img src={quickViewPost.image} className="w-full h-full object-cover" />
              </div>
              
              <div className="w-full md:w-1/2 p-6 md:p-8 space-y-6 flex flex-col justify-center">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-cyan-500 text-[10px] font-bold uppercase tracking-widest">
                        <Tag className="w-3 h-3" /> {quickViewPost.category}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{quickViewPost.title}</h2>
                    </div>
                    <button onClick={() => setQuickViewPost(null)} className="sm:hidden text-gray-500">
                      <Plus className="w-6 h-6 rotate-45" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                      quickViewPost.rarity === 'Legendary' ? 'bg-yellow-500 text-black' :
                      quickViewPost.rarity === 'Epic' ? 'bg-purple-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {quickViewPost.rarity}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <div className="w-5 h-5 rounded-full bg-gray-800 overflow-hidden">
                      <img src={`https://picsum.photos/seed/${quickViewPost.seller}/20/20`} className="w-full h-full object-cover" />
                    </div>
                    <span className="truncate">Vendedor: {quickViewPost.seller}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Preço Atual</p>
                  <p className="text-3xl md:text-4xl font-mono font-bold text-cyan-500">{quickViewPost.price}</p>
                </div>

                <div className="pt-4 flex gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setQuickViewPost(null);
                      handlePurchase(quickViewPost);
                    }}
                    className="flex-1 bg-white text-black font-bold py-4 rounded-xl hover:bg-cyan-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-5 h-5" /> Comprar Agora
                  </motion.button>
                  <button 
                    onClick={() => setQuickViewPost(null)}
                    className="hidden sm:block p-4 bg-[#1a1a1a] border border-[#333] rounded-xl text-gray-500 hover:text-white transition-colors"
                  >
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {selectedPostForPurchase && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProcessingPayment && setSelectedPostForPurchase(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[#0a0a0a] sm:bg-[#141414] border-x border-t sm:border border-[#222] p-6 md:p-8 rounded-t-3xl sm:rounded-3xl w-full max-w-md h-full sm:h-auto overflow-y-auto no-scrollbar shadow-2xl space-y-6 mt-12 sm:mt-0"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">Finalizar Compra</h2>
                <button onClick={() => setSelectedPostForPurchase(null)} className="text-gray-500 hover:text-white transition-colors">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              {paymentSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 space-y-4"
                >
                  <div className="flex justify-center">
                    <div className="bg-green-500/20 p-4 rounded-full">
                      <ShieldCheck className="w-12 h-12 text-green-500" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold">Pagamento Confirmado!</h3>
                  <p className="text-gray-400 text-sm">O vendedor será notificado e você receberá os detalhes em breve.</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-[#1a1a1a] p-3 rounded-2xl border border-[#333]">
                    <img src={selectedPostForPurchase.image} className="w-16 h-16 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-bold text-sm">{selectedPostForPurchase.title}</h4>
                      <p className="text-cyan-500 font-mono font-bold">{selectedPostForPurchase.price}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Método de Pagamento</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setPaymentMethod("mpesa")}
                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                          paymentMethod === "mpesa" ? "bg-red-500/10 border-red-500 text-red-500" : "bg-[#1a1a1a] border-[#333] text-gray-500 hover:border-gray-600"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${paymentMethod === "mpesa" ? "bg-red-500 text-white" : "bg-gray-700 text-gray-400"}`}>M</div>
                        <span className="text-xs font-bold">M-Pesa</span>
                      </button>
                      <button 
                        onClick={() => setPaymentMethod("emola")}
                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                          paymentMethod === "emola" ? "bg-yellow-500/10 border-yellow-500 text-yellow-500" : "bg-[#1a1a1a] border-[#333] text-gray-500 hover:border-gray-600"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${paymentMethod === "emola" ? "bg-yellow-500 text-black" : "bg-gray-700 text-gray-400"}`}>E</div>
                        <span className="text-xs font-bold">e-Mola</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Número de Telefone</label>
                    <input 
                      type="tel"
                      className="w-full p-3 rounded-xl bg-[#1a1a1a] border border-[#333] focus:border-cyan-500 outline-none transition-all" 
                      placeholder="84 / 85 / 86 / 87..." 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!paymentMethod || !phoneNumber || isProcessingPayment}
                    className={`w-full p-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      !paymentMethod || !phoneNumber || isProcessingPayment 
                      ? "bg-gray-800 text-gray-600 cursor-not-allowed" 
                      : "bg-cyan-500 text-black hover:bg-cyan-400"
                    }`}
                    onClick={confirmPayment}
                  >
                    {isProcessingPayment ? (
                      <>Processando... <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-black border-t-transparent rounded-full" /></>
                    ) : (
                      <>Confirmar Pagamento <Zap className="w-4 h-4 fill-current" /></>
                    )}
                  </motion.button>
                  <p className="text-[10px] text-center text-gray-600">
                    Você receberá um prompt no seu celular para confirmar a transação.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="border-t border-[#222] p-12 mt-12 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-cyan-500" />
              <h1 className="text-xl font-bold tracking-tighter">MOZGAME</h1>
            </div>
            <p className="text-gray-500 text-sm">
              A maior e mais segura plataforma de comércio gamer de Moçambique.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Plataforma</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="hover:text-cyan-500 cursor-pointer transition-colors">Como Funciona</li>
              <li className="hover:text-cyan-500 cursor-pointer transition-colors">Segurança</li>
              <li className="hover:text-cyan-500 cursor-pointer transition-colors">Verificação</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Suporte</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="hover:text-cyan-500 cursor-pointer transition-colors">Central de Ajuda</li>
              <li className="hover:text-cyan-500 cursor-pointer transition-colors">Denunciar Fraude</li>
              <li className="hover:text-cyan-500 cursor-pointer transition-colors">Contato</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Pagamentos</h4>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-[#141414] border border-[#222] px-3 py-1.5 rounded-lg">
                <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-[10px] font-bold">M</div>
                <span className="text-xs text-gray-400">M-Pesa</span>
              </div>
              <div className="flex items-center gap-2 bg-[#141414] border border-[#222] px-3 py-1.5 rounded-lg">
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-[10px] font-bold text-black">E</div>
                <span className="text-xs text-gray-400">e-Mola</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4">Newsletter</h4>
            <div className="flex gap-2">
              <input className="bg-[#141414] border border-[#222] rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500 w-full" placeholder="Seu email" />
              <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold">OK</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-[#222] mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
          <p>© 2026 Mozgame.com. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <span>Termos de Uso</span>
            <span>Privacidade</span>
            <span>Cookies</span>
          </div>
        </div>
      </footer>

      {/* Mobile Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[70] bg-[#0a0a0a]/95 backdrop-blur-lg border-t border-[#222] px-6 py-3 flex justify-around items-center">
        <button 
          onClick={() => setActiveView("marketplace")}
          className={`flex flex-col items-center gap-1 transition-colors ${activeView === "marketplace" ? "text-cyan-500" : "text-gray-500"}`}
        >
          <Gamepad2 className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Mercado</span>
        </button>
        <button 
          onClick={() => setActiveView("hub")}
          className={`flex flex-col items-center gap-1 transition-colors ${activeView === "hub" ? "text-cyan-500" : "text-gray-500"}`}
        >
          <Activity className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Início</span>
        </button>
        <button 
          onClick={() => setIsHistoryOpen(true)}
          className="flex flex-col items-center gap-1 text-gray-500 hover:text-cyan-500 transition-colors"
        >
          <ShoppingBag className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Pedidos</span>
        </button>
      </div>

      {/* Chat Bar */}
      <div className={`fixed bottom-0 md:bottom-6 right-0 md:right-6 z-[80] w-full md:w-80 transition-all duration-300 ${isChatOpen ? "h-full md:h-[500px]" : "h-20 w-20"}`}>
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute inset-0 bg-[#0a0a0a] md:bg-[#141414] border-x border-t md:border border-[#222] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-[#222] bg-[#1a1a1a] flex justify-between items-center h-16 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-bold text-sm">Chat Global</span>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="text-gray-500 hover:text-white transition-colors p-2">
                  <X className="w-6 h-6 md:w-5 md:h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2">
                    <MessageSquare className="w-8 h-8 opacity-20" />
                    <p className="text-xs">Seja o primeiro a dizer olá!</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2 ${msg.user === user?.name ? "flex-row-reverse" : ""}`}>
                      <img src={msg.avatar} className="w-6 h-6 rounded-full object-cover mt-1 shrink-0" />
                      <div className={`max-w-[80%] space-y-1 ${msg.user === user?.name ? "items-end" : ""}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-500">{msg.user}</span>
                          <span className="text-[8px] text-gray-600 font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={`p-3 rounded-2xl text-sm ${
                          msg.user === user?.name 
                          ? "bg-cyan-500 text-black rounded-tr-none" 
                          : "bg-[#1a1a1a] border border-[#222] text-gray-300 rounded-tl-none shadow-sm"
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-[#222] bg-[#1a1a1a] pb-8 md:pb-4">
                <div className="relative">
                  <input
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl py-3 pl-4 pr-12 text-sm outline-none focus:border-cyan-500 transition-all placeholder:text-gray-700"
                    placeholder="Ecreva aqui..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <button 
                    onClick={sendMessage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-cyan-500 text-black p-2 rounded-lg hover:bg-cyan-400 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isChatOpen && (
          <motion.div className="absolute inset-0 flex items-center justify-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsChatOpen(true)}
              className="w-14 h-14 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-2xl relative transition-transform"
            >
              <MessageSquare className="w-6 h-6" />
              {chatMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0a0a0a]">
                  {chatMessages.length > 9 ? "9+" : chatMessages.length}
                </span>
              )}
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
