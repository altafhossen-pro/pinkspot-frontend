'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function FactsSection() {
    const [facts, setFacts] = useState([])

    // Fake data for facts section - will be replaced with API call
    const fakeFacts = [
        {
            id: 1,
            title: "Free Delivery",
            description: "Fast, free shipping on all orders.",
            icon: "/images/facts/1.png",
            isActive: true,
            order: 1
        },
        {
            id: 2,
            title: "24/7 Support",
            description: "Help anytime, day or night.",
            icon: "/images/facts/2.png",
            isActive: true,
            order: 2
        },
        {
            id: 3,
            title: "Money Back",
            description: "Easy returns, guaranteed refund.",
            icon: "/images/facts/3.png",
            isActive: true,
            order: 3
        },
        {
            id: 4,
            title: "Discount",
            description: "Special savings on select items.",
            icon: "/images/facts/4.png",
            isActive: true,
            order: 4
        }
    ]

    useEffect(() => {
        fetchFacts()
    }, [])

    const fetchFacts = async () => {
        try {

            setFacts(fakeFacts)
        } catch (error) {
            console.error('Error fetching facts:', error)
            setFacts(fakeFacts)
        }
    }

    if (!facts || facts.length === 0) {
        return null
    }

    return (
        <section className="lg:py-16 py-4 bg-white px-4">
            <div className="max-w-screen-2xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {facts.map((fact) => (
                        <div
                            key={fact.id}
                            className="text-center "
                        >
                            {/* Icon */}
                            <div className="mb-4 flex justify-center">
                                <div className="w-16 h-16 relative">
                                    <Image
                                        src={fact.icon}
                                        alt={fact.title}
                                        fill
                                        className="object-contain "
                                        sizes="64px"
                                    />
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-bold text-gray-900 mb-2 ">
                                {fact.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {fact.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
