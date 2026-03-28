import React, { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/autoplay";

const demoReviews = [
  {
    id: 1,
    name: "Arun Neupane",
    designation: "Coder / Programmer",
    avatar: "https://avatars.githubusercontent.com/u/151126592?v=4",
    rating: 5,
    review: "Amazing service! My iPhone trade-in was smooth and fast.",
    active: true,
  },
  {
    id: 2,
    name: "Gyanendra Aryal",
    designation: "Film Enthusiast",
    avatar: "https://avatars.githubusercontent.com/u/206973237?v=4",
    rating: 4,
    review: "Highly recommend CashYourPhone. Quick and professional.",
    active: true,
  },
  {
    id: 3,
    name: "Anjila",
    designation: "Student",
    avatar: "https://avatars.githubusercontent.com/u/54539708?v=4",
    rating: 5,
    review: "Best trade-in prices and friendly staff. Will come again!",
    active: true,
  },
  {
    id: 4,
    name: "Amrit Khanal",
    designation: "Designer",
    avatar: "https://avatars.githubusercontent.com/u/172172082?v=4",
    rating: 4,
    review: "Smooth process, and they really care about customer satisfaction.",
    active: true,
  },
];

const ReviewStar = ({ filled }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-4 w-4 ${filled ? "text-primary-blue-active" : "text-text-muted"}`}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.286-3.96a1 1 0 00-.364-1.118L2.034 9.387c-.783-.57-.38-1.81.588-1.81h4.162a 1 1 0 00.95-.69l1.286-3.96z" />
  </svg>
);

function normalizeReview(r) {
  const id = r?._id || r?.id || crypto?.randomUUID?.() || String(Math.random());
  const name = r?.name || r?.fullName || "Anonymous";
  const designation = r?.designation || r?.title || r?.role || "Customer";

  const ratingRaw = Number(r?.rating ?? r?.stars ?? 5);
  const rating = Number.isFinite(ratingRaw)
    ? Math.max(1, Math.min(5, ratingRaw))
    : 5;

  const review = r?.review || r?.message || r?.text || "";
  const avatar = r?.avatar || r?.photoUrl || r?.image || "https://i.pravatar.cc/160";

  // keep active (default true if missing)
  const active = r?.active ?? true;

  return { id, name, designation, rating, review, avatar, active };
}

export default function Reviews() {
  const [apiReviews, setApiReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL;

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE}/api/v1/reviews`);
        if (!res.ok) throw new Error(`Failed: ${res.status}`);

        const data = await res.json();

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.reviews)
          ? data.reviews
          : [];

        //Normalize + filter: must have text + must be active
        const normalized = list
          .map(normalizeReview)
          .filter((x) => x.review && x.active === true);

        if (alive) setApiReviews(normalized);
      } catch (e) {
        if (alive) setApiReviews([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (API_BASE) load();
    else setLoading(false);

    return () => {
      alive = false;
    };
  }, [API_BASE]);

  const reviewsToShow = useMemo(() => {
    return apiReviews.length ? apiReviews : demoReviews;
  }, [apiReviews]);

  return (
    <section className="py-20 sm:py-24 bg-gradient-to-b from-surface-white-subtle via-white to-surface-white-subtle">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            What Our Customers Say
          </h2>
          <p className="mt-3 text-base sm:text-lg text-text-muted">
            Real feedback from people who sold and bought phones with us.
          </p>
        </div>

        <Swiper
          className="pb-10"
          modules={[Pagination, Autoplay]}
          spaceBetween={32}
          slidesPerView={1.1}
          pagination={{ clickable: true }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          loop={true}
          breakpoints={{
            640: { slidesPerView: 1.2 },
            768: { slidesPerView: 2.1 },
            1024: { slidesPerView: 3.1 },
          }}
        >
          {reviewsToShow.map((review) => (
            <SwiperSlide key={review.id} className="h-auto">
              <div className="group h-full bg-white p-7 sm:p-8 rounded-3xl shadow-md ring-1 ring-black/5 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={review.avatar}
                      alt={review.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow"
                      onError={(e) => {
                        e.currentTarget.src = "https://i.pravatar.cc/160";
                      }}
                    />
                    <div className="min-w-0">
                      <h3 className="font-semibold leading-tight truncate">
                        {review.name}
                      </h3>
                      <p className="text-sm text-text-muted truncate">
                        {review.designation}
                      </p>
                    </div>
                  </div>

                  <div className="text-text-muted text-5xl leading-none select-none opacity-70 group-hover:opacity-100 transition">
                    “
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <ReviewStar key={i} filled={i <= review.rating} />
                  ))}
                  <span className="ml-2 text-sm text-text-muted">
                    {Number(review.rating).toFixed(1)}
                  </span>
                </div>

                <p className="text-text-primary leading-relaxed text-sm sm:text-base">
                  {review.review}
                </p>

                {loading && (
                  <p className="text-xs text-text-muted mt-4">Loading reviews…</p>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
