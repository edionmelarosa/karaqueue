import LobbyClient from "./LobbyClient";
import FeedbackWidget from "@/components/FeedbackWidget";

export default function LobbyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center px-4 py-10">
      <FeedbackWidget />

      {/* Logo — static, server-rendered for SEO */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-cyan-400 drop-shadow-[0_0_16px_#00d4ff]">
          KaraQueue
        </h1>
        <p className="mt-2 text-gray-400 text-sm">
          Free online karaoke — powered by YouTube
        </p>
      </div>

      {/* Interactive lobby buttons */}
      <LobbyClient />

      {/* SEO content block — static prose Google can read */}
      <section className="mt-16 max-w-xl text-center text-gray-400 text-sm leading-relaxed space-y-2">
        <p>
          <strong className="text-gray-300">KaraQueue</strong> is a free karaoke machine that runs
          entirely in your browser. Search any song on YouTube, add it to a shared queue, and sing
          along with friends — no download, no sign-up, no subscription.
        </p>
        <p>
          Host a karaoke night at home, at a party, or online. Share a room code and let everyone
          add their favourite songs to the queue. Works on any device.
        </p>
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-gray-400">
          <li>✓ Free karaoke online</li>
          <li>✓ YouTube karaoke search</li>
          <li>✓ Shared song queue</li>
          <li>✓ No account required</li>
          <li>✓ Works on mobile &amp; desktop</li>
        </ul>
      </section>

      {/* Footer */}
      <footer className="mt-12 flex items-center gap-2 text-gray-700 text-[10px]">
        <span>Powered by</span>
        <a
          href="https://www.youtube.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-gray-500 transition-colors"
          aria-label="YouTube"
        >
          <svg viewBox="0 0 90 20" className="h-3 fill-current text-red-700" aria-hidden="true">
            <path d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 2.24288e-07 14.285 0 14.285 0C14.285 0 5.35042 2.24288e-07 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C2.24288e-07 5.35042 0 10 0 10C0 10 2.24288e-07 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5677 5.35042 27.9727 3.12324Z" />
            <path d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z" className="fill-white" />
          </svg>
          <span>YouTube</span>
        </a>
      </footer>
    </div>
  );
}
