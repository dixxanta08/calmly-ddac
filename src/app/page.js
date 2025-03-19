
"use client";
import { getEducationalMaterials, getTherapists } from '@/services/apiService';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const Home = () => {
  const router = useRouter();
  const [therapists, setTherapists] = useState([]);
  const [educationalMaterials, setEducationalMaterials] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const therapistData = await getTherapists();
        setTherapists(therapistData.slice(0, 3));

      } catch (error) {
        console.error("Error fetching therapist data:", error);
      }

      try {
        const materialsData = await getEducationalMaterials();
        setEducationalMaterials(materialsData.slice(0, 3)); // Display only 3 materials
      } catch (error) {
        console.error("Error fetching educational materials:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="font-inter bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <div className="text-center w-full">
                <h2 className="w-16 h-8 text-[#218551] text-3xl font-semibold text-center ">Calmly</h2>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
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
            <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
              <button className="bg-blue-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-blue-700 transition-colors" onClick={() => router.push('/auth/login')}>
                Login
              </button>
              <button className="bg-white border-blue-600 text-blue-600 rounded-lg px-6 py-2 text-sm font-medium hover:bg-blue-300 transition-colors" onClick={() => router.push('/auth/register')}>
                Register
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 via-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">You're Not Alone.</span>
            <span className="block text-blue-600">We're Here to Help.</span>
          </h1>
          <p className="mt-6 text-xl text-gray-500">
            Professional mental health support and resources to guide you through your journey to wellness.
          </p>
          <div className="mt-10">
            <button className="bg-blue-600 text-white rounded-lg px-8 py-3 text-lg font-medium hover:bg-blue-700 transition-colors" onClick={() => router.push('/auth/login')}>
              Book an Appointment
            </button>
          </div>
        </div>
      </section>

      {/* Therapists Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Meet Our Therapists
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {therapists?.map((therapist, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <img src={therapist.imageUrl || '/default-therapist.jpg'} alt={therapist.name} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900">{therapist.name}</h3>
                  <p className="mt-2 text-gray-600">{therapist.email}</p>

                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Helpful Resources */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Helpful Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {educationalMaterials?.map((material, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <img src={material.image || '/default-resource.jpg'} alt={material.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900">{material.title}</h3>
                  <p className="mt-2 text-gray-600">{material.description}</p>
                  <a href="#" className="mt-4 inline-flex items-center text-blue-600 font-medium">
                    Read More
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
