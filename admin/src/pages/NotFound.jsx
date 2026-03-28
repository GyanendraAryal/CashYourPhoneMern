import React from "react";
import { Link } from "react-router-dom";

function LogoIllustration() {
    return (
        <svg
            viewBox="0 0 700 520"
            className="w-full h-auto"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            {/* Outer neon rings */}
            <circle cx="260" cy="260" r="170" stroke="rgb(34 211 238)" strokeWidth="6" opacity="0.95" />
            <circle cx="260" cy="260" r="138" stroke="rgb(236 72 153)" strokeWidth="5" opacity="0.85" />
            <circle cx="260" cy="260" r="105" stroke="rgb(250 204 21)" strokeWidth="4" opacity="0.9" />

            {/* Small accent dots like the sample */}
            <circle cx="420" cy="175" r="10" stroke="rgb(236 72 153)" strokeWidth="4" />
            <circle cx="120" cy="330" r="8" stroke="rgb(34 211 238)" strokeWidth="4" opacity="0.9" />

            {/* Phone icon in the center (clean + neon) */}
            <rect
                x="220"
                y="170"
                width="80"
                height="165"
                rx="18"
                stroke="rgb(34 211 238)"
                strokeWidth="6"
            />
            <path
                d="M235 205 H285"
                stroke="rgb(34 211 238)"
                strokeWidth="6"
                strokeLinecap="round"
            />
            <circle
                cx="260"
                cy="312"
                r="9"
                stroke="rgb(34 211 238)"
                strokeWidth="6"
            />

            {/* Circular text arcs (stylized strokes, not real font text) */}
            {/* Top arc line */}
            <path
                d="M120 260 C150 150, 370 150, 400 260"
                stroke="rgb(34 211 238)"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.75"
            />
            {/* Bottom arc line */}
            <path
                d="M120 260 C150 370, 370 370, 400 260"
                stroke="rgb(236 72 153)"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.75"
            />

            {/* Decorative swooshes like your cricket illustration */}
            <path
                d="M70 260 C110 190, 150 190, 190 220"
                stroke="rgb(34 211 238)"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.75"
            />
            <path
                d="M330 300 C370 330, 420 360, 470 360"
                stroke="rgb(236 72 153)"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.75"
            />
        </svg>
    );
}


export default function NotFound() {
    return (
        /* Viewport-locked container */
        <div
            className="
        fixed inset-0 z-50
        bg-[#071A4A] text-white
        flex items-center justify-center
        px-6 py-10
        overflow-hidden
      "
        >
            {/* glow blobs */}
            <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 bg-cyan-400/10 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 bg-pink-500/10 rounded-full blur-3xl" />

            <div className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                {/* Illustration */}
                <div className="max-w-xl mx-auto lg:mx-0">
                    <LogoIllustration />

                </div>

                {/* Text */}
                <div className="text-center lg:text-left">
                    <div className="text-[84px] sm:text-[110px] font-extrabold leading-none tracking-tight text-cyan-300/90">
                        404
                    </div>

                    <h1 className="mt-4 text-3xl sm:text-4xl font-bold">
                        Oops: Page not found
                    </h1>

                    <p className="mt-3 text-white/75 max-w-md mx-auto lg:mx-0">
                        The page you’re trying to reach doesn’t exist or was moved.
                    </p>

                    <div className="mt-8 flex gap-3 justify-center lg:justify-start">
                        <Link
                            to="/"
                            className="rounded-full bg-white text-[#071A4A] px-6 py-3 font-semibold shadow-lg hover:opacity-95"
                        >
                            HOME →
                        </Link>

                        <button
                            onClick={() => window.history.back()}
                            className="rounded-full border border-white/20 bg-white/5 px-6 py-3 font-semibold hover:bg-white/10"
                        >
                            Go back
                        </button>
                    </div>

                    <div className="mt-8 text-sm text-white/50">
                        CashYourPhone • Error 404
                    </div>
                </div>
            </div>
        </div>
    );
}
