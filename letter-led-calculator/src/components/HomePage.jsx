import { Link } from 'react-router-dom';

const calculators = [
  {
    to: '/front-lit',
    title: 'Front-lit Letter',
    description:
      'Acrylic face that lights up from the front using LED modules inside the letter body.',
    accent: 'from-amber-400 to-orange-500',
    icon: 'A',
  },
  {
    to: '/back-lit',
    title: 'Back-lit Letter',
    description:
      'Halo-effect letters with LED modules behind the letter creating a glow on the wall.',
    accent: 'from-sky-400 to-blue-600',
    icon: 'B',
  },
  {
    to: '/edge-lit',
    title: 'Edge-lit Letter',
    description:
      'Clear or frosted acrylic lit from the edge using LED strips along grooves.',
    accent: 'from-emerald-400 to-teal-600',
    icon: 'E',
  },
  {
    to: '/lightbox',
    title: 'Lightbox Letter',
    description:
      'Built lightbox-style letter with face material, side frame and back plate.',
    accent: 'from-fuchsia-400 to-purple-600',
    icon: 'L',
  },
];

export default function HomePage() {
  return (
    <div>
      <div className="text-center mb-8 md:mb-10">
        <h1 className="text-2xl md:text-4xl font-bold text-slate-800">
          Letter LED Sign Price Calculator
        </h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base">
          Choose a calculator below to estimate cost and selling price in THB.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {calculators.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="group bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 hover:shadow-md hover:border-brand-200 transition"
          >
            <div className="flex items-start gap-4">
              <div
                className={`shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${c.accent} text-white text-2xl md:text-3xl font-bold grid place-items-center shadow`}
              >
                {c.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-lg md:text-xl font-semibold text-slate-800 group-hover:text-brand-600">
                  {c.title}
                </h2>
                <p className="text-sm text-slate-500 mt-1">{c.description}</p>
                <div className="mt-3 text-sm font-medium text-brand-600 group-hover:text-brand-700">
                  Open calculator &rarr;
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
