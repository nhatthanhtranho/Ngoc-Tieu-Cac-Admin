"use client";

import { ReactNode, useRef, useState, useEffect, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "swiper/css";
import "swiper/css/navigation";

interface BookSwiperProps {
  children: ReactNode[];
  renderMore: number; // số lượng item thêm vào mỗi view
}

export default function BookSwiper({ children, renderMore }: BookSwiperProps) {
  const baseSlides = { mobile: 4, tablet: 6, desktop: 8 };

  // Tính tổng slidesPerView và slidesPerGroup dựa trên renderMore
  const slidesConfig = useMemo(
    () => ({
      mobile: baseSlides.mobile + renderMore,
      tablet: baseSlides.tablet + renderMore,
      desktop: baseSlides.desktop + renderMore,
    }),
    [renderMore]
  );

  // Tổng nhóm tính theo cấu hình desktop (max hiển thị)
  const slidesPerGroup = slidesConfig.desktop;
  const totalGroups = Math.ceil(children.length / slidesPerGroup);

  const [activeGroup, setActiveGroup] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);

  const prevRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (swiperInstance && prevRef.current && nextRef.current) {
      swiperInstance.params.navigation.prevEl = prevRef.current;
      swiperInstance.params.navigation.nextEl = nextRef.current;
      swiperInstance.navigation.init();
      swiperInstance.navigation.update();
    }
  }, [swiperInstance]);

  return (
    <div className="relative w-full">
      <Swiper
        modules={[Navigation]}
        spaceBetween={20}
        breakpoints={{
          0: {
            slidesPerView: slidesConfig.mobile,
            slidesPerGroup: slidesConfig.mobile,
          },
          768: {
            slidesPerView: slidesConfig.tablet,
            slidesPerGroup: slidesConfig.tablet,
          },
          1280: {
            slidesPerView: slidesConfig.desktop,
            slidesPerGroup: slidesConfig.desktop,
          },
        }}
        onSlideChange={(swiper) => {
          if (swiper.isEnd) {
            setActiveGroup(totalGroups - 1);
          } else {
            setActiveGroup(Math.floor(swiper.activeIndex / slidesPerGroup));
          }
        }}
        onSwiper={setSwiperInstance}
      >
        {children.map((child, index) => (
          <SwiperSlide key={index}>{child}</SwiperSlide>
        ))}
      </Swiper>

      {/* 🎯 Thanh điều hướng góc phải trên */}
      {totalGroups > 1 && (
        <div className="absolute flex items-center -top-11 right-0 z-10">
          <div
            ref={prevRef}
            className="flex items-center justify-center cursor-pointer rounded-l-xl bg-gray-800/80 hover:bg-gray-700 w-8 h-8 transition duration-300 border border-gray-700"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </div>

          <div className="flex items-center justify-center bg-gray-800/80 border-t border-b border-gray-700 w-14 h-8 text-sm font-medium text-white select-none">
            {activeGroup + 1} / {totalGroups}
          </div>

          <div
            ref={nextRef}
            className="flex items-center justify-center cursor-pointer rounded-r-xl bg-gray-800/80 hover:bg-gray-700 w-8 h-8 transition duration-300 border border-gray-700"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}
