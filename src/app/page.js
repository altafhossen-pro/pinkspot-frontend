import CategorySlider from "@/components/Homepage/CategorySlider/CategorySlider";
import HeroSection from "@/components/Homepage/HeroSection/HeroSection";
import FeaturedProducts from "@/components/Homepage/FeaturedProducts/FeaturedProducts";
import BestSellingProducts from "@/components/Homepage/BestSellingProducts/BestSellingProducts";
import NewArrivalProducts from "@/components/Homepage/NewArrivalProducts/NewArrivalProducts";
import OfferBanner from "@/components/Homepage/OfferBanner/OfferBanner";
import JustForYou from "@/components/Homepage/JustForYou/JustForYou";
import ProductForYou from "@/components/Homepage/ProductForYou/ProductForYou";
import FactsSection from "@/components/Homepage/FactsSection/FactsSection";
import CustomerTestimonial from "@/components/Homepage/CustomerTestimonial/CustomerTestimonial";
import Footer from "@/components/Footer/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">

      <HeroSection />
      <CategorySlider />
      {/* <FeaturedProducts /> */}
      {/* <BestSellingProducts /> */}
      {/* <NewArrivalProducts /> */}
      {/* <OfferBanner /> */}
      {/* <JustForYou /> */}
      <ProductForYou />
      <FactsSection />
      <CustomerTestimonial />
      <Footer />
    </div>
  );
}
