"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  GlassWater, 
  Check, 
  ChevronDown, 
  Sparkles, 
  Heart,
  Send
} from "lucide-react";
import { WEDDING_CONFIG } from "@/data/weddingInfo";
import { GUESTS } from "@/data/guests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Повертає правильну форму слова залежно від числа
 * @param {number} number - Число
 * @param {string} one - Форма для 1 (день, година, хвилина, секунда)
 * @param {string} few - Форма для 2-4 (дні, години, хвилини, секунди)
 * @param {string} many - Форма для 5-9, 0, 11-19 (днів, годин, хвилин, секунд)
 */
function getPlural(number: number, one: string, few: string, many: string): string {
  const n = Math.abs(number) % 100;
  const n1 = n % 10;

  if (n > 10 && n < 20) return many;
  if (n1 > 1 && n1 < 5) return few;
  if (n1 === 1) return one;
  return many;
}

const photos = [
  "/gallery/1.jpg",
  "/gallery/2.jpg",
  "/gallery/3.jpg",
  "/gallery/4.jpg",
  // додай сюди свої фото
];

export default function WeddingPage({ params }: PageProps) {
  const [currentSlug, setCurrentSlug] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("Дорогі гості");
  const [attendance, setAttendance] = useState<string>("yes");
  const [drinks, setDrinks] = useState<string[]>([]);
  const [customDrink, setCustomDrink] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState(photos.length); // починаємо з середньої копії  
    
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  
  const extendedPhotos = [...photos, ...photos, ...photos];

  // Кількість фото на сторінці (на ПК — 3)
  const [itemsPerPage, setItemsPerPage] = useState(1);

useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth >= 768) {
      setItemsPerPage(3); // На десктопі 3 фото
    } else if (window.innerWidth >= 640) {
      setItemsPerPage(2); // На планшеті 2 фото
    } else {
      setItemsPerPage(1); // На мобільному 1 фото
    }
  };

  handleResize(); // Початкова перевірка
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

  // Починаємо з першого елемента СЕРЕДНЬОГО блоку

  // Обробники гортання вліво / вправо
  const handleNext = () => {
    setCurrentPhoto((prev) => {
      const nextIndex = prev + 1;
      // Якщо дойшли до кінця третього блоку — безперешкодно повертаємося в середину
      if (nextIndex >= photos.length * 2) {
        return photos.length;
      }
      return nextIndex;
    });
  };

  const handlePrev = () => {
    setCurrentPhoto((prev) => {
      const prevIndex = prev - 1;
      // Якщо вийшли за початок середнього блоку вліво — повертаємося в кінець середнього
      if (prevIndex < photos.length) {
        return photos.length * 2 - 1;
      }
      return prevIndex;
    });
  };

  useEffect(() => {
    // Коли підходимо до краю дубльованого масиву — тихо перескакуємо в середину
    if (currentPhoto <= photos.length - 3) {
      setCurrentPhoto(currentPhoto + photos.length);
    } else if (currentPhoto >= photos.length * 2) {
      setCurrentPhoto(currentPhoto - photos.length);
    }
  }, [currentPhoto, photos.length]);

  useEffect(() => {
    params.then((resolvedParams) => {
      const slug = resolvedParams.slug;
      setCurrentSlug(slug);
      if (GUESTS[slug]) {
        setGuestName(GUESTS[slug].names);
      }
    });
  }, [params]);

  useEffect(() => {
    // Встановлюємо точну дату і час події
    const targetDate = new Date("2026-11-11T14:00:00+02:00").getTime(); // Київський час (UTC+2)
  
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;
  
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        clearInterval(interval); // Зупиняємо таймер, якщо час минув
      }
    }, 1000);
  
    return () => clearInterval(interval);
  }, []);

  const handleDrinkChange = (drink: string) => {
    setDrinks((prev) =>
      prev.includes(drink) ? prev.filter((d) => d !== drink) : [...prev, drink]
    );
  };

  const handleSubmitRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const formData = {
      guestName: guestName, // Ім'я з бази чи посилання
      attendance: attendance === "yes" ? "Прийде" : "Не зможе",
      drinks: drinks.join(", "),
      customDrink: customDrink,
    };
  
    try {
      // Приклад запису через SheetDB (або ваш власний endpoint)
      await fetch("https://sheetdb.io/api/v1/vbvcyfnzeg4gq", {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: [formData] })
      });
      
      setSubmitted(true);
    } catch (error) {
      console.error("Помилка надсилання:", error);
      alert("Сталася помилка. Спробуйте ще раз пізніше.");
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const fadeInVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: "easeOut" } 
    },
  };

  return (
    <main className="min-h-screen bg-[#F7F4EF] text-[#5B4133] font-sans antialiased selection:bg-[#D8C4AA] selection:text-[#5B4133]">
      
    {/* 1. HERO SECTION */}
    <section 
  className="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat"
  style={{ backgroundImage: "url('/background.jpg')" }}
>
  {/* Легке світле затемнення для кращої читабельності тексту (за бажанням можна прибрати) */}
  <div className="absolute inset-0 bg-[#F7F4EF]/40 pointer-events-none" />
  
  {/* Верхня навігація */}
<header className="relative z-30 w-full flex items-center justify-between px-6 md:px-12 lg:px-16 py-5 md:py-6">
  <div className="text-xs md:text-sm tracking-[0.2em] uppercase text-[#5B4133]/90 font-medium">
    Поліна & Максим
  </div>
  
  <nav className="hidden md:flex items-center gap-8 text-xs tracking-[0.15em] uppercase text-[#5B4133]/90">
    <a href="#details" className="hover:text-[#707F4E] transition-colors">Деталі</a>
    <a href="#dresscode" className="hover:text-[#707F4E] transition-colors">Дрес-код</a>
    <a href="#program" className="hover:text-[#707F4E] transition-colors">Програма</a>
    <a href="#rsvp" className="hover:text-[#707F4E] transition-colors">RSVP</a>
  </nav>

  <button className="md:hidden text-[#5B4133]">
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  </button>
</header>

{/* Основний контент */}
<div className="relative z-20 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16 pt-4 md:pt-6 pb-16 md:pb-20 grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 items-center">
  
  {/* Ліва частина — текст */}
  <div className="md:col-span-7 flex flex-col justify-center">
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
      className="space-y-6 md:space-y-7 text-center md:text-left"
    >
      <p className="text-s tracking-[0.25em] uppercase text-[#5B4133]/70 font-medium">
        Наша історія
      </p>

      <h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl font-serif text-[#5B4133] leading-[1.05] text-center md:text-left">
  <span className="block">Поліна</span>
  <span className="block text-4xl sm:text-5xl md:text-5xl lg:text-6xl text-[#A8B89A] my-1 font-serif md:pl-20">
    &
  </span>
  <span className="block">Максим</span>
</h1>

<div className="space-y-3 pt-1">
  <p className="text-4xl md:text-3xl font-serif text-[#5B4133] tracking-wider">
    11 · 11 · 2026
  </p>
  <div className="w-12 h-[1px] bg-[#C5AA6F] mx-auto md:mx-0"></div>
</div>

      <p className="text-xl md:text-xl text-[#5B4133]/80 font-light leading-relaxed max-w-lg mx-auto md:mx-0">
  Будемо дуже раді розділити цей особливий день з вами!
</p>

      <div className="pt-2">
      <a
  href="#personal-invitation"
  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#707F4E] text-white text-lg tracking-wide hover:bg-[#5C6A3F] transition-all shadow-sm
             w-full min-w-0
             sm:w-auto
             lg:min-w-[300px]"
>
  Переглянути деталі
  <span className="text-lg">→</span>
</a>
</div>
    </motion.div>
  </div>

  {/* Права частина — фото */}
  <div className="md:col-span-5 flex justify-center md:justify-end items-center">
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
      className="relative w-full max-w-sm lg:max-w-[420px]"
    >
      <div className="absolute -bottom-4 -right-4 w-full h-full border-2 border-[#A8B89A]/60 rounded-sm pointer-events-none" />
      
      <div className="relative overflow-hidden rounded-sm shadow-md bg-white">
        <Image
          src="/couple.jpg"
          alt="Поліна та Максим"
          width={700}
          height={900}
          priority
          className="w-full h-auto object-cover"
        />
      </div>
    </motion.div>
  </div>
</div>

{/* М’який градієнтний перехід (нижчий z-index, щоб не накривав кнопку) */}
<div className="absolute bottom-0 left-0 right-0 h-32 md:h-48 bg-gradient-to-t from-[#F7F4EF] via-[#F7F4EF]/70 to-transparent pointer-events-none z-10" />
</section>

{/* Персоналізоване запрошення гостя */}
      <section id="personal-invitation" className="bg-[#F7F4EF] py-16 md:py-24 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInVariants}
          className="max-w-lg mx-auto"
        >
          <div className="bg-white/80 backdrop-blur-sm border border-[#D8C4AA]/50 rounded-2xl px-8 py-10 md:px-12 md:py-12 text-center shadow-sm">
            
            {/* Верхня тонка лінія */}
            <div className="w-10 h-px bg-[#C5AA6F]/70 mx-auto mb-8" />

            <p className="text-4xl sm:text-4xl font-serif text-[#5B4133] leading-relaxed mb-6">
              <span className="font-medium">{guestName}</span>
            </p>

            <p className="text-2xl sm:text-xl md:text-2xl font-serif text-[#5B4133]/85 leading-relaxed">
              З радістю запрошуємо <br />
              розділити з нами найважливіший день —<br />
              день, коли ми станемо сім’єю.
            </p>

            {/* Нижня тонка лінія */}
            <div className="w-10 h-px bg-[#C5AA6F]/70 mx-auto mt-8" /> </div>
          
          {/* таймер */}
          <div className="grid grid-cols-4 gap-4 md:gap-6 max-w-xl mx-auto pt-6">
  {[
    { 
      label: getPlural(timeLeft.days, "День", "Дні", "Днів"), 
      value: timeLeft.days 
    },
    { 
      label: getPlural(timeLeft.hours, "Година", "Години", "Годин"), 
      value: timeLeft.hours 
    },
    { 
      label: getPlural(timeLeft.minutes, "Хвилина", "Хвилини", "Хвилин"), 
      value: timeLeft.minutes 
    },
    { 
      label: getPlural(timeLeft.seconds, "Секунда", "Секунди", "Секунд"), 
      value: timeLeft.seconds 
    },
  ].map((item, i) => (
    <div
      key={i}
      className="flex flex-col items-center p-4 md:p-5 rounded-2xl bg-white shadow-sm border border-[#F7F4EF]"
    >
      <span className="text-3xl md:text-4xl font-serif font-medium text-[#5B4133]">
        {item.value}
      </span>
      <span className="text-xs md:text-sm text-[#5B4133]/60 font-light mt-1 uppercase tracking-wider">
        {item.label}
      </span>
    </div>
  ))}
</div>
        </motion.div>
      </section>

      {/* 2. ЛОКАЦІЯ ТА ЧАС */}
      <section id="details" className="max-w-5xl mx-auto px-4 sm:px-6 py-20 space-y-12">
        {/* Заголовок */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInVariants}
          className="text-center space-y-3"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#707F4E]">
            Деталі та розклад
          </h2>
        </motion.div>

        {/* Дві картки в ряд: Ресторан та Дата */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Картка 1: Ресторан */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInVariants}
            className="bg-white p-8 sm:p-10 rounded-3xl border border-[#D8C4AA]/40 shadow-sm flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#707F4E]/10 flex items-center justify-center text-[#707F4E]">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-3xl sm:text-4xl text-[#5B4133]">
                {WEDDING_CONFIG.locationName}
              </h3>
              <p className="text-[#5B4133]/80 text-lg sm:text-xl leading-relaxed">
                {WEDDING_CONFIG.address}
              </p>
            </div>
            
            <div className="pt-4 border-t border-[#F7F4EF] flex items-center justify-between text-base sm:text-lg font-medium">
              <span className="text-[#707F4E] flex items-center gap-2">
                <Clock className="w-4 h-4" /> Збір гостей: 14:00
              </span>
              <a
                href="https://maps.app.goo.gl/EBZpRKESuMDJ8WJL8"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D4AF37] hover:underline font-serif text-xl sm:text-2xl"
              >
                Маршрут →
              </a>
            </div>
          </motion.div>

          {/* Картка 2: Коли? (Дата) */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInVariants}
            className="bg-white p-8 sm:p-10 rounded-3xl border border-[#D8C4AA]/40 shadow-sm flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#707F4E]/10 flex items-center justify-center text-[#707F4E]">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-3xl sm:text-4xl text-[#5B4133]">
                Коли?
              </h3>
              <p className="text-[#5B4133]/90 text-2xl sm:text-3xl font-serif font-medium">
                {new Date(WEDDING_CONFIG.date).toLocaleDateString("uk-UA", {
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
            
            <div className="pt-4 border-t border-[#F7F4EF] flex items-center justify-between text-lg sm:text-lg font-medium text-[#707F4E]">
              <span>
                {(() => {
                  const date = new Date(WEDDING_CONFIG.date);
                  const weekday = date.toLocaleDateString("uk-UA", { weekday: "long" });
                  const year = date.getFullYear();
                  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
                  return `${capitalizedWeekday}, ${year} рік`;
                })()}
              </span>
              <span className="text-[#D4AF37] font-serif text-xl sm:text-2xl">
  Чекаємо!
</span>
            </div>
          </motion.div>
        </div>

        {/* Велика карта та кнопка під нею */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInVariants}
          className="space-y-4"
        >
          <div className="w-full h-80 sm:h-96 rounded-3xl overflow-hidden border border-[#D8C4AA]/40 shadow-sm relative">
            <iframe
              src="https://maps.google.com/maps?q=49.233083980439744, 28.39355008994733&z=16&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Кнопка відкриття в Google Maps */}
          <div className="flex justify-center pt-2">
            <a
              href="https://maps.app.goo.gl/j8bv1YrRoMAo2ruQ7"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-[#D8C4AA]/60 text-[#5B4133] hover:bg-[#F7F4EF] font-serif transition-all shadow-sm text-xl sm:text-xl hover:scale-[1.02]"
            >
              <MapPin className="w-4 h-4 text-[#D4AF37] " />
              Відкрити в Google Maps
            </a>
          </div>
        </motion.div>

        {/* Програма свята (Timeline) */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInVariants}
        id = "program" className="bg-white p-8 sm:p-12 rounded-3xl border border-[#D8C4AA]/40 shadow-sm space-y-8"
      >
        <h3 className="text-4xl sm:text-5xl font-serif text-[#5B4133] text-center">
          Програма свята
        </h3>

        <div className="max-w-2xl mx-auto space-y-10 relative before:absolute before:inset-0 before:left-3.5 sm:before:left-1/2 before:-ml-px before:w-0.5 before:bg-[#D8C4AA]/50">
          {[
            { time: "14:00", title: "Збір гостей & Welcome drink"},
            { time: "15:00", title: "Урочиста церемонія"},
            { time: "16:30", title: "Весільний бенкет"},
            { time: "20:00", title: "Весільний торт & Танці"},
          ].map((item, idx) => {
            const isLeft = idx % 2 === 0; // парні зліва, непарні справа

            return (
              <div key={idx} className="relative flex items-start sm:items-center">
                {/* Точка на лінії */}
                <div className="absolute left-3.5 sm:left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#707F4E] border-4 border-white shadow-md z-10 shrink-0" />

                {/* Контент */}
                <div
                  className={`w-full sm:w-[42%] space-y-1 pl-12 sm:pl-0 ${
                    isLeft
                      ? "sm:pr-2 sm:text-right sm:ml-0"
                      : "sm:pl-2 sm:text-left sm:ml-auto"
                  }`}
                >
                  <span className="text-3xl font-semibold text-[#D4AF37] font-serif">
                    {item.time}
                  </span>
                  <h4 className="text-3xl font-serif text-[#5B4133]">
                    {item.title}
                  </h4>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
            </section>

      {/* 3. ДРЕС-КОД */}
      <section id="dresscode" className="bg-[#F7F4EF] py-20 px-4 sm:px-6 border-y border-[#D8C4AA]/30">
        <div className="max-w-5xl mx-auto space-y-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInVariants}
            className="text-center space-y-3"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif text-[#5B4133]">
              {WEDDING_CONFIG.dressCode.title}
            </h2>
            <p className="text-base sm:text-lg font-medium tracking-[0.3em] uppercase text-[#707F4E]">
              {WEDDING_CONFIG.dressCode.subtitle}
            </p>
            <div className="w-12 h-[2px] bg-[#707F4E] mx-auto rounded-full mt-2" />
          </motion.div>

          <p className="text-[#5B4133]/90 max-w-2xl mx-auto text-xl sm:text-2xl leading-relaxed text-center font-light">
            Ми будемо дуже вдячні, якщо ви підтримаєте кольорову гаму нашого свята у своїх образах:
          </p>

          {/* Палітра кольорів: На мобільному — вертикальний список з підписом збоку, На десктопі — горизонтальний рядок */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInVariants}
            className="flex flex-col md:flex-row md:flex-wrap lg:flex-nowrap justify-center items-start md:items-center gap-6 sm:gap-8 max-w-md md:max-w-none mx-auto pt-2"
          >
            {WEDDING_CONFIG.dressCode.colors.map((color, idx) => (
              <div 
                key={idx} 
                className="flex flex-row md:flex-col items-center gap-4 md:gap-3 w-full md:w-auto"
              >
                {/* Кружечок без додаткових квадратних плашок */}
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full border-4 border-white shadow-md transition-transform hover:scale-105"
                  style={{ backgroundColor: color.hex }}
                />
                
                {/* Підпис кольору збільшено на +2 розміри */}
                <span className="text-xl sm:text-lg md:text-xl font-serif font-medium text-[#5B4133] text-left md:text-center">
                  {color.name}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Приклад вбрання */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInVariants}
            className="flex justify-center pt-6"
          >
            <div className="w-full max-w-4xl p-4 sm:p-6 bg-[#FDFBF9] rounded-3xl border border-[#D8C4AA]/30 shadow-sm">
              <Image
                src="/dress-code.png"
                alt="Приклади вбрання для дрес-коду"
                width={1200}
                height={800}
                priority
                className="w-full h-auto rounded-2xl object-cover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Про подарунки */}
<section className="bg-[#F7F4EF] py-20 px-6">
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={fadeInVariants}
    className="max-w-2xl mx-auto text-center space-y-8"
  >
    <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#5B4133]">
      Про подарунки
    </h2>

    {/* Іконка пляшки + келиха */}
      <div className="flex justify-center text-[#A8B89A]">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M8 2h8l-1 7H9L8 2z" />
          <path d="M9 9v11a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V9" />
          <path d="M16 13h2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <path d="M18 13V9" />
        </svg>
      </div>

      <div className="space-y-5 text-[#5B4133]/85 text-2xl sm:text-2xl font-serif leading-relaxed">
        <p>
        Замість квітів чи пляшки алкоголю, будемо щасливі, якщо ви підтримаєте нашу маленьку сімейну ініціативу.
        На святі ви знайдете QR-код, за яким зможете долучитися до збору для наших захисників — тих, завдяки кому ми маємо змогу святкувати цей день разом.
        </p>
      </div>
    </motion.div>
  </section>

     {/* Карусель фотографій */}
<section className="bg-[#F7F4EF] py-20 px-4 sm:px-6 overflow-hidden">
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={fadeInVariants}
    className="max-w-6xl mx-auto space-y-10"
  >
    <div className="text-center space-y-3">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#5B4133]">
        Наші моменти
      </h2>
      <div className="w-12 h-[2px] bg-[#D4AF37] mx-auto rounded-full" />
    </div>

    <div className="relative">
      {/* Обгортка, яка приховує фото поза межами */}
      <div className="overflow-hidden rounded-2xl">
        <motion.div
          className="flex"
          /* 
            На мобільному зміщуємо на 100% за одне фото, 
            але якщо хочете адаптивну сітку:
          */
          animate={{ x: `-${currentPhoto * (100 / itemsPerPage)}%` }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
        >
          {extendedPhotos.map((src, idx) => (
            <div
              key={idx}
              className="w-full sm:w-1/2 md:w-1/3 flex-shrink-0 px-2 sm:px-3"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-sm border border-[#D8C4AA]/30 bg-white">
                <Image
                  src={src}
                  alt={`Фото ${(idx % photos.length) + 1}`}
                  fill
                  priority={idx < 6}
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                />
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Кнопка Вліво */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Попереднє фото"
        className="absolute left-2 sm:-left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 backdrop-blur-md border border-[#D8C4AA]/60 flex items-center justify-center text-[#5B4133] text-2xl hover:bg-white hover:scale-110 transition-all shadow-md z-10"
      >
        ‹
      </button>

      {/* Кнопка Вправо */}
      <button
        type="button"
        onClick={handleNext}
        aria-label="Наступне фото"
        className="absolute right-2 sm:-right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 backdrop-blur-md border border-[#D8C4AA]/60 flex items-center justify-center text-[#5B4133] text-2xl hover:bg-white hover:scale-110 transition-all shadow-md z-10"
      >
        ›
      </button>
    </div>

    {/* Точки навігації */}
    <div className="flex justify-center items-center gap-2 pt-2">
      {photos.map((_, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => setCurrentPhoto(photos.length + idx)}
          aria-label={`Перейти до фото ${idx + 1}`}
          className={`h-2.5 rounded-full transition-all duration-300 ${
            (currentPhoto % photos.length) === idx
              ? "bg-[#707F4E] w-7"
              : "bg-[#D8C4AA]/60 hover:bg-[#D8C4AA] w-2.5"
          }`}
        />
      ))}
    </div>
  </motion.div>
</section>

      {/* 5. RSVP СЕКЦІЯ */}
      <section id = "rsvp" className="bg-gradient-to-b from-[#F7F4EF] via-[#FFFFFF] to-[#F7F4EF] py-20 px-4 sm:px-6 border-t border-[#D8C4AA]/30">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInVariants}
          className="max-w-xl mx-auto bg-white p-6 sm:p-10 rounded-3xl shadow-md border border-[#D8C4AA]/50 space-y-8"
        >
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-serif text-[#5B4133]">
              Підтвердження присутності
            </h2>
            <p className="text-xl sm:text-xl text-[#707F4E] font-medium">
              Будь ласка, якнайшвидше дайте відповідь щоб ми планували нашу зустріч з вами.
            </p>
          </div>

          {submitted ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 bg-[#707F4E]/10 text-[#5B4133] rounded-2xl text-center space-y-3 border border-[#707F4E]/20"
            >
              <div className="w-12 h-12 bg-[#707F4E] text-white rounded-full flex items-center justify-center mx-auto mb-2">
                <Check className="w-6 h-6" />
              </div>
              <p className="font-serif text-3xl text-[#5B4133]">Дякуємо за вашу відповідь!</p>
              <p className="text-lg text-[#5B4133]/80 font-light">
                Ми зберегли ваші побажання та з нетерпінням чекаємо на зустріч у наш особливий день!
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmitRSVP} className="space-y-6">
              {/* Вибір присутності */}
              <div className="space-y-3">
                <label className="text-3xl sm:text-2xl font-serif text-[#5B4133] font-medium">
                  Чи зможете ви прийти?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className={`py-6 text-lg sm:text-base rounded-xl transition-all ${
                      attendance === "yes"
                        ? "bg-[#707F4E] hover:bg-[#5C6A3F] text-white border-[#707F4E]"
                        : "border-[#D8C4AA] text-[#5B4133] hover:bg-[#F7F4EF]"
                    }`}
                    onClick={() => setAttendance("yes")}
                  >
                    Так, з радістю!
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={`py-6 text-lg sm:text-base rounded-xl transition-all ${
                      attendance === "no"
                        ? "bg-[#5B4133] hover:bg-[#4A3123] text-white border-[#5B4133]"
                        : "border-[#D8C4AA] text-[#5B4133] hover:bg-[#F7F4EF]"
                    }`}
                    onClick={() => setAttendance("no")}
                  >
                    На жаль, ні
                  </Button>
                </div>
              </div>

              {/* Вибір напоїв (якщо "Так") */}
              {attendance === "yes" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-4 pt-2"
                >
                  <label className="text-3xl sm:text-2xl font-serif text-[#5B4133] font-medium flex items-center gap-2">
                    Яким напоям віддаєте перевагу?
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-lg text-[#5B4133]">
                    {["Біле вино", "Червоне вино", "Горілка", "Джин", "Віскі", "Просекко"].map(
                      (drink) => (
                        <label
                          key={drink}
                          className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                            drinks.includes(drink)
                              ? "bg-[#F7F4EF] border-[#707F4E]"
                              : "border-[#D8C4AA]/40 hover:bg-[#F7F4EF]/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={drinks.includes(drink)}
                            onChange={() => handleDrinkChange(drink)}
                            className="accent-[#707F4E] w-4 h-4 rounded"
                          />
                          <span className="font-medium text-xl sm:text-base">{drink}</span>
                        </label>
                      )
                    )}
                  </div>
                  <Input
                    placeholder="Свій варіант або алергії/побажання..."
                    value={customDrink}
                    onChange={(e) => setCustomDrink(e.target.value)}
                    className="mt-2 text-lg sm:text-lg lg:text-lg p-3 rounded-xl border-[#D8C4AA] text-[#5B4133] focus:ring-[#707F4E]"
                  />
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#707F4E] hover:bg-[#B89628] text-white font-serif py-6 text-base sm:text-lg rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Надіслати відповідь
              </Button>
            </form>
          )}
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 text-center text-xl sm:text-xl text-[#5B4133]/70 font-light border-t border-[#D8C4AA]/30 bg-[#F7F4EF] space-y-2">
        <div className="flex items-center justify-center gap-1 text-[#707F4E]">
          <Heart className="w-4 h-4 fill-current" />
        </div>
        <p>Чекаємо на вас!</p>
        <p className="font-serif text-2xl text-[#5B4133] font-medium">
          З любов'ю, Поліна та Максим!
        </p>
      </footer>
    </main>
  );
}