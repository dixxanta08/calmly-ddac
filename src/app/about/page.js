"use client";

import { useRouter } from 'next/navigation';

const AboutUs = () => {
    const router = useRouter();

    return (
        <div className="font-inter bg-gray-50 min-h-screen">
            {/* Navbar */}
            <nav className="bg-white shadow-sm fixed w-full z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex-shrink-0 flex items-center">
                            <div className="text-center w-full">
                                <h2 className="w-16 h-8 text-[#218551] text-3xl font-semibold text-center ">Calmly</h2>
                            </div>
                        </div>
                        <div className="hidden sm:flex sm:space-x-8">
                            {['Home', 'About'].map((item) => (
                                <a
                                    key={item}
                                    href={item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '-')}`}
                                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                >
                                    {item}
                                </a>
                            ))}

                        </div>
                        <div className="hidden sm:flex sm:items-center gap-4">
                            <button
                                className="bg-blue-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
                                onClick={() => router.push('/auth/login')}
                            >
                                Login
                            </button>
                            <button
                                className="bg-white border-blue-600 text-blue-600 rounded-lg px-6 py-2 text-sm font-medium hover:bg-blue-300 transition-colors"
                                onClick={() => router.push('/auth/register')}
                            >
                                Register
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* About Us Section */}
            <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 via-green-50 to-blue-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-6">
                        About Us
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        We are committed to providing professional mental health support to help you through every step of your journey.
                        Our platform connects you with experienced therapists and provides access to helpful resources to support your mental well-being.
                    </p>
                    <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                        Your mental health matters. You&apos;re not alone — we&apos;re here to help.
                    </p>
                </div>
            </section>

            {/* Our Mission Section */}
            <section className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Our mission is to make mental health care accessible and affordable for everyone.
                        We strive to create a safe and supportive space where you can find the help you need.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default AboutUs;
