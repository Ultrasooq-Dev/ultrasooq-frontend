import Image from "next/image";
// import { Inter } from 'next/font/google'
import { useRouter } from "next/router";
import LogoIcon from "@/public/images/logo.png";

// const inter = Inter({ subsets: ['latin'] })

export default function House() {
  const router = useRouter();
  const handleClick = (e, name) => {
    e.preventDefault();
    router.push("/" + name);
  };
  return (
    <main className={`flex min-h-screen flex-col justify-between p-0 `}>
      {/* <header className="w-full">
        <div className="w-full bg-dark-cyan">
          <div className="container m-auto px-3">
            <div className="hidden sm:hidden md:flex md:gap-x-2.5">
              <div className="py-4 text-sm font-normal text-white md:w-5/12 lg:w-4/12">
                <p>Welcome to Martfury Online Shopping Store !</p>
              </div>
              <div className="flex justify-end py-4 text-sm font-normal text-white md:w-7/12 lg:w-8/12">
                <ul className="flex justify-end">
                  <li className="border-r border-solid border-white px-2 text-sm font-normal text-white">
                    <a href="#">Store Location</a>
                  </li>
                  <li className="border-r border-solid border-white px-2 text-sm font-normal text-white">
                    <a href="#">Track Your Order</a>
                  </li>
                  <li className="border-r border-solid border-white px-2 text-sm font-normal text-white">
                    <select className="border-0 bg-transparent text-white focus:outline-hidden">
                      <option className="bg-dark-cyan">USD</option>
                      <option className="bg-dark-cyan">INR</option>
                      <option className="bg-dark-cyan">AUD</option>
                    </select>
                  </li>
                  <li className="px-2 pr-0 text-sm font-normal text-white">
                    <select className="border-0 bg-transparent text-white focus:outline-hidden">
                      <option className="bg-dark-cyan">English</option>
                      <option className="bg-dark-cyan">German</option>
                      <option className="bg-dark-cyan">French</option>
                    </select>
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap sm:flex sm:flex-wrap md:flex md:flex-wrap">
              <div className="order-3 flex w-10/12 items-center py-4 sm:order-3 sm:w-10/12 md:order-2 md:w-7/12 md:px-3 lg:w-4/6">
                <div className="h-11 w-24 md:w-24 lg:w-auto">
                  <select className="h-full w-full focus:outline-hidden">
                    <option>All</option>
                    <option>Apps & Games</option>
                    <option>Beauty</option>
                    <option>Car & Motorbike</option>
                    <option>Clothing & Accessories</option>
                    <option>Computers & Accessories</option>
                    <option>Electronics</option>
                    <option>Movies & TV Shows</option>
                  </select>
                </div>
                <div className="h-11 w-4/6 border-l border-solid border-indigo-200">
                  <input
                    type="search"
                    className="form-control h-full w-full p-2.5 text-black focus:outline-hidden"
                    placeholder="I’m shopping for..."
                  />
                </div>
                <div className="h-11 w-1/6">
                  <button
                    type="button"
                    className="btn h-full w-full bg-dark-orange text-sm font-semibold text-white"
                  >
                    Search
                  </button>
                </div>
              </div>
              <div className="order-2 flex w-7/12 justify-end py-4 sm:order-2 sm:w-7/12 md:order-3 md:w-3/12 lg:w-1/6">
                <ul className="flex items-center justify-end gap-x-4">
                  <li className="relative flex pb-3 pl-0 pr-1 pt-0">
                    <a className="flex flex-wrap items-center">
                      <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-dark-orange text-xs font-bold text-white">
                        0
                      </div>
                    </a>
                  </li>
                  <li className="relative flex pb-3 pl-0 pr-1 pt-0">
                    <a className="flex flex-wrap items-center">
                      <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-dark-orange text-xs font-bold text-white">
                        0
                      </div>
                    </a>
                  </li>
                  <li className="relative flex pb-3 pl-0 pr-1 pt-0">
                    <a className="ml-1.5 flex flex-col flex-wrap items-center text-sm font-bold text-white">
                      <span onClick={() => Router.push("/login")}>Login </span>
                      <span onClick={() => Router.push("/register")}>
                        {" "}
                        Register
                      </span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="fixed left-0 top-0 z-20 hidden h-full w-full bg-dark-cyan px-3 md:static md:flex md:px-0">
              <ul className="flex w-full flex-col flex-wrap items-start justify-start gap-x-1 md:flex-row md:justify-between">
                <li className="flex py-3 text-sm font-semibold uppercase text-white md:py-5 md:text-sm lg:text-base xl:text-lg">
                  <a href="javascript:void(0);" className="flex gap-x-2">
                    Home
                  </a>
                </li>
                <li className="flex py-3 text-sm font-semibold uppercase text-white md:py-5 md:text-sm lg:text-base xl:text-lg">
                  <a href="javascript:void(0);" className="flex gap-x-2">
                    Trending & Hot Deals
                  </a>
                </li>
                <li className="flex py-3 text-sm font-semibold uppercase text-white md:py-5 md:text-sm lg:text-base xl:text-lg">
                  <a href="javascript:void(0);" className="flex gap-x-2">
                    buygroup
                  </a>
                </li>
                <li className="flex py-3 text-sm font-semibold uppercase text-white md:py-5 md:text-sm lg:text-base xl:text-lg">
                  <a href="javascript:void(0);" className="flex gap-x-2">
                    rfq
                  </a>
                </li>
                <li className="flex py-3 text-sm font-semibold uppercase text-white md:py-5 md:text-sm lg:text-base xl:text-lg">
                  <a href="javascript:void(0);" className="flex gap-x-2">
                    pos store
                  </a>
                </li>
                <li className="flex py-3 text-sm font-semibold uppercase text-white md:py-5 md:text-sm lg:text-base xl:text-lg">
                  <a href="javascript:void(0);" className="flex gap-x-2">
                    Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="w-full border-b border-solid border-gray-300">
          <div className="container m-auto px-3">
            <div className="flex">
              <div className="flex w-5/12 py-3 md:w-2/6">
                <span className="mx-3 text-sm font-normal capitalize text-color-dark sm:text-base md:text-lg">
                  All Categories
                </span>
              </div>
              <div className="flex w-7/12 items-center justify-end md:w-4/6">
                <ul className="flex items-center justify-end gap-x-4">
                  <li className="py-1.5 text-sm font-normal capitalize text-light-gray sm:text-base md:text-lg">
                    <a href="#" className="text-light-gray">
                      Buyer Central
                    </a>
                  </li>
                  <li className="py-1.5 text-sm font-normal capitalize text-light-gray sm:text-base md:text-lg">
                    <a href="#" className="text-light-gray">
                      Help Center
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </header> */}

      <section className="w-100 py-8">
        <div className="container mx-auto px-4">
          <div className="rounded bg-indigo-500 px-7 py-6">
            <div className="flex flex-wrap">
              <div className="mb-10 w-full pt-6 md:mb-0 md:w-1/2">
                <h3 className="mb-1 text-2xl font-bold text-white">
                  <span className="text-green-300">Try For Free</span>
                  <span>New Features</span>
                </h3>
                <p className="mb-8 text-sm font-medium text-indigo-100 md:mb-16">
                  No charge for seven days
                </p>
                <a
                  className="flex items-center font-medium text-white"
                  href="#"
                >
                  <svg
                    className="mr-1"
                    width="12"
                    height="14"
                    viewbox="0 0 12 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.92 6.62C11.8724 6.49725 11.801 6.38511 11.71 6.29L6.71 1.29C6.61676 1.19676 6.50607 1.1228 6.38425 1.07234C6.26243 1.02188 6.13186 0.995911 6 0.995911C5.7337 0.995911 5.4783 1.1017 5.29 1.29C5.19676 1.38324 5.1228 1.49393 5.07234 1.61575C5.02188 1.73758 4.99591 1.86814 4.99591 2C4.99591 2.2663 5.1017 2.5217 5.29 2.71L8.59 6H1C0.734784 6 0.48043 6.10536 0.292893 6.2929C0.105357 6.48043 0 6.73479 0 7C0 7.26522 0.105357 7.51957 0.292893 7.70711C0.48043 7.89465 0.734784 8 1 8H8.59L5.29 11.29C5.19627 11.383 5.12188 11.4936 5.07111 11.6154C5.02034 11.7373 4.9942 11.868 4.9942 12C4.9942 12.132 5.02034 12.2627 5.07111 12.3846C5.12188 12.5064 5.19627 12.617 5.29 12.71C5.38296 12.8037 5.49356 12.8781 5.61542 12.9289C5.73728 12.9797 5.86799 13.0058 6 13.0058C6.13201 13.0058 6.26272 12.9797 6.38458 12.9289C6.50644 12.8781 6.61704 12.8037 6.71 12.71L11.71 7.71C11.801 7.6149 11.8724 7.50275 11.92 7.38C12.02 7.13654 12.02 6.86346 11.92 6.62Z"
                      fill="#D7D5F8"
                    ></path>
                  </svg>
                  <span>Check demo</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-5">
        <div
          className="rounded-lg bg-white p-3 shadow-sm"
          onClick={(e) => handleClick(e, "house")}
        >
          <h3 className="border-b text-xs">font-sans</h3>
          <p className="font-sans">House Page</p>
        </div>
        <div
          className="rounded-lg bg-white p-3 shadow-sm"
          onClick={(e) => handleClick(e, "home")}
        >
          <h3 className="border-b text-xs">font-serif</h3>
          <p className="font-serif">project page</p>
        </div>
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <h3 className="border-b text-xs">font-mono</h3>
          <p className="font-mono">
            The quick brown fox jumps over the lazy dog.
          </p>
        </div>
      </div>

      <figure className="rounded-xl bg-slate-100 p-8 dark:bg-slate-800 md:flex md:p-2">
        <div className="space-y-4 pt-6 text-center md:p-8 md:text-left">
          <blockquote>
            <p className="text-lg font-medium">
              “Tailwind CSS is the only framework that I&apos;ve seen scale on
              large teams. It&apos;s easy to customize, adapts to any design,
              and the build size is tiny.”
            </p>
          </blockquote>
          <figcaption className="font-medium">
            <div className="text-sky-500 dark:text-sky-400">Sarah Dayan</div>
            <div className="text-slate-700 dark:text-slate-500">
              Staff Engineer, Algolia
            </div>
          </figcaption>
        </div>
      </figure>

      <div className="flex font-sans ">
        <form className="flex-auto p-6">
          <div className="flex flex-wrap">
            <h1 className="flex-auto font-medium text-slate-900">
              Kids Jumpsuit
            </h1>
            <div className="order-1 mt-2 w-full flex-none text-3xl font-bold text-violet-600">
              $39.00
            </div>
            <div className="text-sm font-medium text-slate-400">In stock</div>
          </div>
          <div className="mb-6 mt-4 flex items-baseline border-b border-slate-200 pb-6">
            <div className="flex space-x-2 text-sm font-bold">
              <label>
                <input
                  className="peer sr-only"
                  name="size"
                  type="radio"
                  value="xs"
                  checked
                />
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-violet-400 peer-checked:bg-violet-600 peer-checked:text-white">
                  XS
                </div>
              </label>
              <label>
                <input
                  className="peer sr-only"
                  name="size"
                  type="radio"
                  value="s"
                />
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-violet-400 peer-checked:bg-violet-600 peer-checked:text-white">
                  S
                </div>
              </label>
              <label>
                <input
                  className="peer sr-only"
                  name="size"
                  type="radio"
                  value="m"
                />
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-violet-400 peer-checked:bg-violet-600 peer-checked:text-white">
                  M
                </div>
              </label>
              <label>
                <input
                  className="peer sr-only"
                  name="size"
                  type="radio"
                  value="l"
                />
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-violet-400 peer-checked:bg-violet-600 peer-checked:text-white">
                  L
                </div>
              </label>
              <label>
                <input
                  className="peer sr-only"
                  name="size"
                  type="radio"
                  value="xl"
                />
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-violet-400 peer-checked:bg-violet-600 peer-checked:text-white">
                  XL
                </div>
              </label>
            </div>
          </div>
          <div className="mb-5 flex space-x-4 text-sm font-medium">
            <div className="flex flex-auto space-x-4">
              <button
                className="h-10 rounded-full bg-violet-600 px-6 font-semibold text-white"
                type="submit"
              >
                Buy now
              </button>
              <button
                className="h-10 rounded-full border border-slate-200 px-6 font-semibold text-slate-900"
                type="button"
              >
                Add to bag
              </button>
            </div>
            <button
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-violet-50 text-violet-600"
              type="button"
              aria-label="Like"
            >
              <svg
                width="20"
                height="20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                />
              </svg>
            </button>
          </div>
          <p className="text-sm text-slate-500">
            Free shipping on all continental US orders.
          </p>
        </form>
      </div>

      <div className="flex font-serif">
        <form className="flex-auto p-6">
          <div className="flex flex-wrap items-baseline">
            <h1 className="mb-3 w-full flex-none text-2xl leading-none text-slate-900">
              DogTooth Style Jacket
            </h1>
            <div className="flex-auto text-lg font-medium text-slate-500">
              $350.00
            </div>
            <div className="text-xs font-medium uppercase leading-6 text-slate-500">
              In stock
            </div>
          </div>
          <div className="mb-6 mt-4 flex items-baseline border-b border-slate-200 pb-6">
            <div className="flex space-x-1 text-sm font-medium">
              <label>
                <input
                  className="peer sr-only"
                  name="size"
                  type="radio"
                  value="xs"
                  checked
                />
                <div className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 peer-checked:bg-slate-100 peer-checked:text-slate-900">
                  XS
                </div>
              </label>
              <label>
                <input
                  className="peer sr-only"
                  name="size"
                  type="radio"
                  value="s"
                />
                <div className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 peer-checked:bg-slate-100 peer-checked:text-slate-900">
                  S
                </div>
              </label>
              <label>
                <input
                  className="peer sr-only"
                  name="size"
                  type="radio"
                  value="m"
                />
                <div className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 peer-checked:bg-slate-100 peer-checked:text-slate-900">
                  M
                </div>
              </label>
              <label>
                <input
                  className="peer sr-only"
                  name="size"
                  type="radio"
                  value="l"
                />
                <div className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 peer-checked:bg-slate-100 peer-checked:text-slate-900">
                  L
                </div>
              </label>
              <label>
                <input
                  className="peer sr-only"
                  name="size"
                  type="radio"
                  value="xl"
                />
                <div className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 peer-checked:bg-slate-100 peer-checked:text-slate-900">
                  XL
                </div>
              </label>
            </div>
          </div>
          <div className="mb-5 flex space-x-4 text-sm font-medium">
            <div className="flex flex-auto space-x-4 pr-4">
              <button
                className="h-12 w-1/2 flex-none bg-slate-900 font-medium uppercase tracking-wider text-white"
                type="submit"
              >
                Buy now
              </button>
              <button
                className="h-12 w-1/2 flex-none border border-slate-200 font-medium uppercase tracking-wider text-slate-900"
                type="button"
              >
                Add to bag
              </button>
            </div>
            <button
              className="flex h-12 w-12 flex-none items-center justify-center border border-slate-200 text-slate-300"
              type="button"
              aria-label="Like"
            >
              <svg
                width="20"
                height="20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                />
              </svg>
            </button>
          </div>
          <p className="text-sm text-slate-500">
            Free shipping on all continental US orders.
          </p>
        </form>
      </div>

      <div className="flex p-6 font-mono">
        <form className="flex-auto pl-6">
          <div className="relative flex flex-wrap items-baseline pb-6 before:absolute before:-left-60 before:-right-6 before:-top-6 before:bottom-0 before:bg-black">
            <h1 className="relative mb-2 w-full flex-none text-2xl font-semibold text-white">
              Retro Shoe
            </h1>
            <div className="relative text-lg text-white">$89.00</div>
            <div className="relative ml-3 uppercase text-teal-400">
              In stock
            </div>
          </div>
          <div className="my-6 flex items-baseline">
            <div className="flex space-x-3 text-sm font-medium">
              <label>
                <input
                  className="peer sr-only"
                  name="size"
                  type="radio"
                  value="xs"
                  checked
                />
                <div className="relative flex h-10 w-10 items-center justify-center text-black before:absolute before:left-0.5 before:top-0.5 before:z-[-1] before:h-full before:w-full peer-checked:bg-black peer-checked:text-white peer-checked:before:bg-teal-400">
                  XS
                </div>
              </label>
              <label>
                <input
                  className="peer sr-only"
                  name="size"
                  type="radio"
                  value="s"
                />
                <div className="relative flex h-10 w-10 items-center justify-center text-black before:absolute before:left-0.5 before:top-0.5 before:z-[-1] before:h-full before:w-full peer-checked:bg-black peer-checked:text-white peer-checked:before:bg-teal-400">
                  S
                </div>
              </label>
              <label>
                <input
                  className="peer sr-only"
                  name="size"
                  type="radio"
                  value="m"
                />
                <div className="relative flex h-10 w-10 items-center justify-center text-black before:absolute before:left-0.5 before:top-0.5 before:z-[-1] before:h-full before:w-full peer-checked:bg-black peer-checked:text-white peer-checked:before:bg-teal-400">
                  M
                </div>
              </label>
              <label>
                <input
                  className="peer sr-only"
                  name="size"
                  type="radio"
                  value="l"
                />
                <div className="relative flex h-10 w-10 items-center justify-center text-black before:absolute before:left-0.5 before:top-0.5 before:z-[-1] before:h-full before:w-full peer-checked:bg-black peer-checked:text-white peer-checked:before:bg-teal-400">
                  L
                </div>
              </label>
              <label>
                <input
                  className="peer sr-only"
                  name="size"
                  type="radio"
                  value="xl"
                />
                <div className="relative flex h-10 w-10 items-center justify-center text-black before:absolute before:left-0.5 before:top-0.5 before:z-[-1] before:h-full before:w-full peer-checked:bg-black peer-checked:text-white peer-checked:before:bg-teal-400">
                  XL
                </div>
              </label>
            </div>
          </div>
          <div className="mb-4 flex space-x-2 text-sm font-medium">
            <div className="flex space-x-4">
              <button
                className="h-12 border-2 border-black bg-teal-400 px-6 font-semibold uppercase tracking-wider text-black"
                type="submit"
              >
                Buy now
              </button>
              <button
                className="h-12 border border-slate-200 px-6 font-semibold uppercase tracking-wider text-slate-900"
                type="button"
              >
                Add to bag
              </button>
            </div>
            <button
              className="flex h-12 w-12 flex-none items-center justify-center text-black"
              type="button"
              aria-label="Like"
            >
              <svg
                width="20"
                height="20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                />
              </svg>
            </button>
          </div>
          <p className="text-xs leading-6 text-slate-500">
            Free shipping on all continental US orders.
          </p>
        </form>
      </div>
    </main>
  );
}
