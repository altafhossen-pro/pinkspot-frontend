import React from 'react';
import * as LucideIcons from 'lucide-react';

async function getStoreFeaturesSettings() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/settings/site-settings`, {
      next: { revalidate: 60 } // Cache for 60 seconds
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.storeFeatures || null;
  } catch (error) {
    console.error('Error fetching store features:', error);
    return null;
  }
}

export default async function StoreFeatures() {
  const storeFeaturesSettings = await getStoreFeaturesSettings();

  // Use dynamic settings or fallback to default
  const backgroundColor = storeFeaturesSettings?.backgroundColor || '#FF1493';
  const textColor = storeFeaturesSettings?.textColor || '#FFFFFF';
  const iconColor = storeFeaturesSettings?.iconColor || '#FFFFFF';

  const isTailwindBg = backgroundColor.startsWith('bg-') || backgroundColor.startsWith('from-') || backgroundColor.includes('gradient');
  const isTailwindText = textColor.startsWith('text-');
  const isTailwindIcon = iconColor.startsWith('text-');
  
  const features = storeFeaturesSettings?.features?.length ? storeFeaturesSettings.features : [
    { icon: 'Truck', title: 'Fast & Free Delivery', subtitle: 'Free delivery for all order over ৳ 3000' },
    { icon: 'Trophy', title: 'High Quality Product', subtitle: 'Maintain proper measurement and quality of product' },
    { icon: 'Monitor', title: '24/7 Customer Support', subtitle: 'Friendly 24/7 Customer Support' },
    { icon: 'Contact', title: 'Secure Online Payment', subtitle: 'We possess SSL/ Secure Certificate' }
  ];

  return (
    <div 
      className={`w-full py-6 px-4 md:px-8 ${isTailwindBg ? backgroundColor : ''}`} 
      style={isTailwindBg ? {} : { backgroundColor }}
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-white/30">
          {features.map((feature, index) => {
            const IconComponent = LucideIcons[feature.icon] || LucideIcons.Star;
            
            return (
              <div
                key={index}
                className={`flex items-center space-x-4 lg:px-6 ${index === 0 ? 'lg:pl-0' : ''} ${index === features.length - 1 ? 'lg:pr-0' : ''} ${isTailwindText ? textColor : ''}`}
                style={isTailwindText ? {} : { color: textColor }}
              >
                <div className={`flex-shrink-0 ${isTailwindIcon ? iconColor : ''}`} style={isTailwindIcon ? {} : { color: iconColor }}>
                  <IconComponent className="w-10 h-10 md:w-12 md:h-12 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[15px] md:text-[16px] leading-tight mb-1">
                    {feature.title}
                  </h4>
                  <p className={`text-[12px] md:text-[13px] leading-tight ${isTailwindText ? '' : 'opacity-90'}`}
                     style={isTailwindText ? {} : { color: textColor }}>
                    {feature.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
