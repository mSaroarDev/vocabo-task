import { useEffect, useState } from "react";
import { getDeviceType, isDesktop, isMobile, isTablet, type DeviceType } from "@/lib/device";

export function useDevice(): {
  device: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
} {
  const [device, setDevice] = useState<DeviceType>(getDeviceType);

  useEffect(() => {
    const handleResize = () => setDevice(getDeviceType());
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    device,
    isMobile: isMobile(),
    isTablet: isTablet(),
    isDesktop: isDesktop(),
  };
}
