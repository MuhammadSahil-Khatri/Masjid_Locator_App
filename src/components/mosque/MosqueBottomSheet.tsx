import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  memo,
} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  Image,
  Share,
  Linking,
} from 'react-native';
import { Users } from 'lucide-react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '../ui/Text';
import { colors, spacing, typography } from '../../theme';
import { useApp } from '../../context/AppContext';
import { usePrayerTimes } from '../../hooks/usePrayerTimes';
import { fetchPrayerTimes, PrayerTimesResult } from '../../services/prayerTimesService';
import { announcementService, Announcement } from '../../services/announcementService';
import {
  FajrIcon,
  ShuruqIcon,
  DhuhrIcon,
  AsrIcon,
  MaghribIcon,
  IshaIcon,
} from '../icons/PrayerIcons';

// ─── SVG Icons ─────────────────────────────────────────────────────────────────

const CrossSvgIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 19 19" fill="none">
    <Line x1="13.9315" y1="4.60355" x2="4.59769" y2="13.9374" stroke="#1D3B6D" strokeWidth={2} />
    <Line x1="14.0681" y1="13.9395" x2="4.73434" y2="4.60568" stroke="#1D3B6D" strokeWidth={2} />
  </Svg>
);

const RedirectSvgIcon = () => (
  <Svg width={14} height={11} viewBox="0 0 13 10" fill="none">
    <Path
      d="M9.66471 0.00260732C10.1284 -0.0391076 10.4272 0.428695 10.727 0.763435L11.5167 1.62977L12.3843 2.58152C12.5481 2.76135 12.7272 2.94463 12.8728 3.14093C13.0618 3.39588 13.0339 3.79418 12.831 4.03313C12.6556 4.2397 12.472 4.43795 12.2892 4.6387L11.2971 5.72781L10.5938 6.50061C10.4505 6.6592 10.3129 6.82157 10.1581 6.96546C9.75175 7.35598 9.09071 6.98503 9.11008 6.40323C9.12655 5.90886 9.72466 5.4681 10.0088 5.11762C10.2441 4.82724 10.5316 4.55956 10.7739 4.27023C10.5509 4.29273 10.2143 4.28227 9.98242 4.28237L8.60919 4.28274H4.25461L3.2421 4.28153C2.48083 4.28093 1.89272 4.20518 1.4566 5.02693C1.24874 5.45824 1.30249 6.14129 1.30278 6.6267L1.30417 8.52093C1.3053 8.73704 1.31888 9.21862 1.28562 9.4065C1.26437 9.53314 1.21264 9.65122 1.13581 9.74844C1.0005 9.91764 0.713898 10.0552 0.507276 9.97797C0.341232 9.91594 0.143911 9.78488 0.0718654 9.6042C0.0270132 9.49171 0.00626111 9.34828 0.00272119 9.22461C-0.00231909 8.63408 0.00327713 8.04344 0.00324971 7.45293L0.00199463 6.34543C0.00138992 5.87021 -0.0193942 5.44461 0.0882292 4.97846C0.19877 4.51391 0.412624 4.08685 0.710578 3.73564C1.07251 3.31261 1.54464 3.02297 2.06224 2.90641C2.4189 2.82446 2.83468 2.84299 3.20283 2.84319L4.5352 2.84434L8.58205 2.84417C9.26877 2.84458 10.1048 2.86972 10.782 2.83937C10.5287 2.59338 10.2297 2.24582 9.98952 1.9778C9.76364 1.72579 9.18172 1.17357 9.12245 0.864425C9.08832 0.678064 9.12161 0.484421 9.21527 0.324592C9.33152 0.128104 9.46791 0.0506163 9.66471 0.00260732"
      fill="white"
    />
  </Svg>
);

const PrayerPeopleSvgIcon = () => (
  <Svg width={30} height={30} viewBox="0 0 34 34" fill="none">
    <Path d="M12.0118 12.3789C12.3157 12.3628 12.6443 12.3697 12.9504 12.3704C12.9269 13.2759 13.0581 13.7093 13.5911 14.4754C14.26 15.4368 15.1632 16.0613 16.323 16.2623C16.323 16.587 16.2483 17.6702 16.4985 17.8191C17.6659 18.5141 17.4527 16.7541 17.4596 16.2464C18.88 16.0153 19.9998 15.0267 20.6081 13.7298C20.8076 13.3045 20.8202 12.8332 20.8378 12.3709C21.0388 12.3674 21.2399 12.3664 21.4409 12.3678C22.9493 12.3852 24.3883 13.0041 25.4383 14.0871C27.0803 15.7884 27.0728 17.6115 27.0135 19.8221C27.0286 20.8208 27.002 21.8744 27.0162 22.8678C27.0362 24.2658 26.0747 25.3056 24.661 25.31C24.2126 25.3114 23.7237 25.3172 23.2611 25.317C22.3259 25.3183 21.3907 25.3115 20.4556 25.2966C21.652 24.2924 21.6692 21.8454 20.5007 20.8232C21.2555 20.7862 22.8856 20.8999 23.4631 20.6723C23.7138 20.1664 23.6391 19.634 23.6437 19.0803C23.6485 18.5053 23.6473 17.917 23.6243 17.3425C23.5897 17.2467 23.5606 17.1115 23.49 17.0365C23.3956 16.9363 23.1749 16.8769 23.042 16.8753C22.9158 16.8737 22.802 16.9209 22.7143 17.0117C22.3719 17.3659 22.5113 19.1564 22.5151 19.6845C18.8215 19.7374 14.9611 19.7 11.2599 19.6877C11.2804 18.9289 11.2844 18.158 11.2447 17.4005C11.2078 16.6974 10.2049 16.728 10.1675 17.3553C10.1001 18.3241 10.1424 19.3253 10.1603 20.2949C10.1731 20.9878 11.6231 20.8069 12.1401 20.806C12.9732 20.8013 13.8063 20.8023 14.6394 20.8089L14.6399 25.309C13.4288 25.329 12.1978 25.3105 10.983 25.3181C10.1973 25.2986 9.38799 25.372 8.60978 25.2565C7.63718 25.1121 6.81769 24.2116 6.77926 23.2328C6.74375 22.3277 6.76495 21.4037 6.76523 20.5178C6.76594 18.3353 6.49657 16.1584 8.06556 14.386C9.1252 13.129 10.3985 12.5289 12.0118 12.3789Z" fill="#1D3B6D" />
    <Path d="M10.1536 26.4297L23.6398 26.4335L23.6418 30.9809C23.6421 31.6969 23.6596 32.4617 23.6203 33.1765C23.6105 33.3539 23.5494 33.4688 23.45 33.6127C23.1002 33.8212 21.7689 33.7524 21.3106 33.7526L18.3619 33.7528C15.8183 33.7526 13.2691 33.7661 10.7261 33.7395C10.4963 33.7371 10.3725 33.6656 10.2158 33.5038C10.0799 33.1118 10.1085 27.2298 10.1536 26.4297Z" fill="#1D3B6D" />
    <Path d="M10.156 8.46094C11.8983 8.89923 12.6764 9.58059 13.3578 11.233C12.508 11.2884 11.8587 11.2288 10.9824 11.4089C8.8852 11.84 7.22235 13.2038 6.28477 15.1128C6.24799 15.1876 6.06859 15.1811 5.99772 15.1866C5.13484 15.1852 4.24433 15.1741 3.38409 15.1902C3.39102 14.6441 3.43032 14.0247 3.37559 13.4895C3.2872 12.6253 2.21689 12.8249 2.2625 13.638C2.29226 14.1684 2.13928 15.8008 2.43829 16.1545C2.94622 16.4048 5.12443 16.2987 5.86627 16.316C5.65297 16.9828 5.64007 17.8627 5.63919 18.5597C4.37884 18.5852 3.10991 18.571 1.84953 18.5646C0.805819 18.5593 0.0398314 17.9251 0.0121845 16.8432C-0.0054217 16.1541 0.0195849 15.4612 0.0148845 14.7717C0.0532154 13.7857 -0.0822979 12.6055 0.0894966 11.6387C0.176656 11.1453 0.359771 10.6738 0.628467 10.2508C1.25661 9.25944 2.0969 8.76173 3.21766 8.50871L3.33375 8.50351C3.4003 8.58356 3.42129 9.47418 3.46868 9.68617C3.79205 11.1328 4.78623 11.9671 6.19399 12.3242C6.19382 12.7209 6.17497 12.9288 6.30259 13.3049C7.25986 13.9358 7.33548 12.9913 7.33886 12.3047C7.97392 12.1836 8.61039 11.8942 9.07192 11.4381C10.0027 10.5183 10.1197 9.6778 10.156 8.46094Z" fill="#1D3B6D" />
    <Path d="M30.4077 8.46094C31.6259 8.77091 32.5422 9.23473 33.2101 10.3656C33.4554 10.7815 33.6198 11.2401 33.6946 11.7173C33.8002 12.3666 33.8296 16.7417 33.6884 17.2877C33.5764 17.7308 33.2889 18.1093 32.8919 18.3358C32.3642 18.6373 31.6491 18.5445 31.0652 18.5657C30.1012 18.6008 29.0937 18.5242 28.1358 18.5645C28.1452 18.0034 28.1254 17.4861 28.0328 16.9308C28.0103 16.7964 27.9447 16.4674 27.9635 16.3588C28.2286 16.1834 30.6401 16.4567 31.3333 16.1773C31.6447 15.6022 31.5362 13.9718 31.4522 13.2826C31.404 12.8868 30.6022 12.8074 30.4754 13.2411C30.3122 13.8225 30.3856 14.5705 30.3905 15.1829C29.4624 15.185 28.397 15.2101 27.4806 15.1697C27.3472 14.8644 27.0707 14.3161 26.8513 14.0664C26.8861 13.8746 26.8575 13.7883 26.723 13.6438L26.7051 13.6249L26.7133 13.5178C26.9046 13.5494 26.9585 13.5475 27.1526 13.5321L27.1848 13.4753C27.6953 13.2017 27.5441 12.7963 27.5951 12.2976C28.5307 12.1041 29.2943 11.6301 29.8266 10.8253C30.3367 10.0542 30.3827 9.35352 30.4077 8.46094Z" fill="#1D3B6D" />
    <Path d="M12.9655 6.74429C15.5503 6.7259 18.2498 6.71366 20.8309 6.75009C20.7849 8.4893 20.9382 9.24639 19.651 10.6627C19.6364 10.6765 19.6216 10.6901 19.6067 10.7035C17.9024 12.2462 15.5056 12.1924 13.9376 10.4654C12.9497 9.37738 12.8843 8.14495 12.9655 6.74429Z" fill="#1D3B6D" />
    <Path d="M28.153 19.6841C29.2751 19.677 30.3973 19.6785 31.5195 19.6887C31.4401 22.119 31.5908 24.6059 31.4989 27.0392C31.4731 27.7243 30.4064 27.5707 29.9219 27.5707L28.1199 27.5682L24.7627 27.5648L24.7662 26.4369C25.6564 26.3702 26.3369 26.1441 27.0155 25.5523C28.2921 24.4391 28.1488 22.9417 28.1395 21.4118C28.1362 20.8588 28.1207 20.2386 28.153 19.6841Z" fill="#1D3B6D" />
    <Path d="M2.27691 19.6829C3.39859 19.6774 4.52029 19.679 5.64195 19.6878C5.6204 20.5877 5.55691 23.0664 5.73522 23.827C5.8506 24.3134 6.07187 24.7683 6.38329 25.1594C7.0945 26.0558 7.93428 26.3226 9.0167 26.4506C9.00823 26.7715 9.03899 27.2565 8.99691 27.5587C7.15644 27.6341 5.25277 27.5217 3.40633 27.5744C3.10898 27.5828 2.68977 27.5621 2.42072 27.4318C2.2094 27.1842 2.26171 26.1187 2.26165 25.7679L2.26145 23.7454C2.2615 22.5354 2.21137 20.862 2.27691 19.6829Z" fill="#1D3B6D" />
    <Path d="M16.5785 1.69335C18.2912 1.60861 19.7633 2.44763 20.4859 4.0194C20.7278 4.54562 20.7947 5.04761 20.8354 5.61866C19.6779 5.65019 18.4218 5.62688 17.2567 5.62762C15.8189 5.61982 14.3811 5.61968 12.9434 5.62716C13.0883 3.44256 14.3601 1.93882 16.5785 1.69335Z" fill="#1D3B6D" />
    <Path d="M3.40211 4.49077C5.62184 4.47428 7.92679 4.4677 10.144 4.49583C10.1309 5.76683 10.0324 6.51724 9.10389 7.47135C9.08167 7.49357 9.05889 7.51529 9.03562 7.53642C8.3501 8.15946 7.50938 8.47088 6.58414 8.42067C5.68403 8.37223 4.84053 7.96638 4.2409 7.29332C3.49552 6.45393 3.3364 5.57903 3.40211 4.49077Z" fill="#1D3B6D" />
    <Path d="M23.6541 4.49262C25.8663 4.47283 28.187 4.46794 30.3967 4.49755C30.3751 5.77759 30.2958 6.50725 29.3552 7.47525C29.3351 7.49528 29.3146 7.51487 29.2937 7.53396C28.6136 8.15401 27.7724 8.46918 26.8524 8.42267C25.9511 8.37778 25.1051 7.97496 24.5021 7.30365C23.7479 6.46254 23.5914 5.585 23.6541 4.49262Z" fill="#1D3B6D" />
    <Path d="M15.7775 20.8031L17.1857 20.7974C18.0437 20.7955 18.9219 20.7725 19.5659 21.4258C20.523 22.3967 20.467 23.6798 19.5646 24.6301C18.7765 25.3294 18.1586 25.318 17.16 25.3149L15.759 25.3109C15.8096 23.867 15.6961 22.222 15.7775 20.8031Z" fill="#1D3B6D" />
    <Path d="M6.49775 0.00975873C7.36977 -0.0565389 8.23366 0.21684 8.9088 0.77273C9.77203 1.48492 10.0493 2.30082 10.1502 3.37142C9.16748 3.40574 8.05391 3.38162 7.06141 3.38204C5.83425 3.37445 4.60705 3.37424 3.37988 3.38134C3.5235 1.49047 4.57597 0.235508 6.49775 0.00975873Z" fill="#1D3B6D" />
    <Path d="M26.7518 0.00981081C27.6369 -0.0576997 28.5131 0.225178 29.1917 0.797501C30.0263 1.502 30.3121 2.32024 30.4008 3.37178C29.4305 3.40268 28.3519 3.38113 27.3735 3.38176C26.1259 3.37368 24.8784 3.37336 23.6309 3.38081C23.784 1.4843 24.822 0.240425 26.7518 0.00981081Z" fill="#1D3B6D" />
    <Path d="M14.0968 12.0986C14.2463 12.164 14.4036 12.27 14.5512 12.3479C16.207 13.2222 18.1442 13.0698 19.7008 12.0703C19.711 12.9742 19.7518 13.0972 19.2526 13.88C18.0966 15.4477 16.1066 15.6728 14.7389 14.174C14.1248 13.5011 14.0345 12.9889 14.0968 12.0986Z" fill="#1D3B6D" />
    <Path d="M20.4043 11.2461C21.0946 9.57139 21.8598 8.87533 23.6274 8.46875C23.6492 10.5305 24.3652 11.7606 26.4285 12.3275L26.4236 12.3622C26.4012 12.5288 26.4022 12.7337 26.4103 12.9018C26.4198 13.0988 26.3779 13.0871 26.3247 13.2628C26.2332 13.14 26.1217 13.0709 25.9697 13.0412C24.1836 11.455 22.6607 11.2307 20.4043 11.2461Z" fill="#1D3B6D" />
    <Path d="M29.2148 8.98563C29.2508 9.03003 29.2621 9.06445 29.259 9.12284C29.1949 10.3076 28.0916 11.3268 26.8956 11.2403C26.1469 11.1862 25.702 10.8803 25.2169 10.3404C24.8701 9.85114 24.8327 9.54767 24.751 8.96875C25.1332 9.16942 25.5389 9.32168 25.9587 9.42209C26.9727 9.65795 28.3258 9.5425 29.2148 8.98563Z" fill="#1D3B6D" />
    <Path d="M8.96561 8.98675C8.9758 9.00004 9.00038 9.06033 9.00878 9.07956C8.99975 9.18348 8.99036 9.37804 8.96079 9.4717C8.34039 11.4374 6.30491 11.8379 4.96754 10.3433C4.62234 9.87771 4.57755 9.52464 4.50098 8.96875C5.79079 9.67627 7.69081 9.77812 8.96561 8.98675Z" fill="#1D3B6D" />
    <Path d="M26.4285 12.3281L26.433 12.3576C26.5154 12.9206 26.29 13.5722 27.185 13.4783L27.1528 13.5351C26.9586 13.5505 26.9048 13.5524 26.7135 13.5208L26.7052 13.6279L26.7232 13.6468C26.8576 13.7913 26.8862 13.8776 26.8515 14.0693C26.5626 13.6479 26.3279 13.4078 25.9697 13.0418C26.1217 13.0715 26.2332 13.1407 26.3247 13.2635C26.3779 13.0877 26.4198 13.0995 26.4103 12.9025C26.4022 12.7343 26.4012 12.5294 26.4236 12.3628L26.4285 12.3281Z" fill="#1D3B6D" />
  </Svg>
);

const ShareSvgIcon = () => (
  <Svg width={14} height={16} viewBox="0 0 14 16" fill="none">
    <Path stroke="#1D3B6D" strokeWidth={0.5} d="M10.9435 0H11.652L11.6666 0.00529784C11.8437 0.0683247 12.0209 0.0911727 12.2198 0.165203C12.854 0.400489 13.3725 0.871898 13.667 1.48079C13.965 2.10428 14.0065 2.81978 13.7827 3.47356C13.5489 4.13875 13.0599 4.68348 12.4237 4.9875C11.8047 5.28567 11.0922 5.32389 10.4449 5.09366C10.0371 4.94797 9.67037 4.70637 9.37556 4.38925C9.12583 4.51858 8.80739 4.72853 8.56314 4.87994L7.18331 5.73514L5.81763 6.58098C5.59888 6.71645 5.26552 6.91019 5.06267 7.05683C5.30098 7.70583 5.2902 8.30725 5.06094 8.95572C5.43839 9.17495 5.82311 9.42175 6.19597 9.6527L8.13839 10.8562C8.49394 11.0765 9.02847 11.4304 9.37989 11.615C9.7675 11.1405 10.4357 10.8366 11.0389 10.7758C11.7356 10.7045 12.4318 10.9154 12.9718 11.3612C13.5036 11.7966 13.8413 12.4248 13.911 13.1085C13.9856 13.8099 13.7724 14.5116 13.3203 15.0529C13.0165 15.4194 12.5911 15.72 12.1353 15.8655C12.042 15.8953 11.7328 15.9673 11.6706 16H10.9595C10.9248 15.9831 10.8524 15.9628 10.8129 15.955C9.73697 15.7431 8.89189 14.8864 8.72308 13.7957C8.64822 13.3122 8.70173 12.92 8.86127 12.4357C8.51995 12.1884 7.96498 11.8824 7.59045 11.6429C6.59653 11.0072 5.55033 10.4034 4.56036 9.76417C4.08842 10.2609 3.44739 10.5883 2.7578 10.6188C2.04864 10.6549 1.35514 10.4019 0.835828 9.91763C0.323183 9.44159 0.0227253 8.77995 0.00166904 8.08069C-0.0239716 7.38914 0.247236 6.70038 0.71725 6.19541C1.18906 5.6968 1.83884 5.40488 2.52497 5.38325C3.36855 5.35305 3.9663 5.67444 4.56403 6.22916C4.73547 6.12967 4.91223 6.01595 5.08031 5.9097C6.33328 5.11764 7.61205 4.35962 8.86323 3.56556C8.85777 3.55206 8.85245 3.53852 8.84728 3.52491C8.61081 2.90303 8.64736 2.15195 8.91958 1.54682C9.19722 0.914636 9.71673 0.420173 10.3619 0.174109C10.549 0.103866 10.767 0.0688194 10.9314 0.00480431L10.9435 0ZM11.4392 4.27433C12.3519 4.20148 13.0332 3.40327 12.9618 2.49045C12.8903 1.57763 12.0931 0.895113 11.1802 0.965163C10.2653 1.03536 9.58099 1.83466 9.65258 2.74944C9.72417 3.66422 10.5245 4.34731 11.4392 4.27433ZM2.83755 9.64617C3.74738 9.52527 4.3863 8.6888 4.26358 7.7792C4.14088 6.86962 3.30314 6.23238 2.3938 6.35689C1.487 6.48105 0.851922 7.31592 0.974297 8.22297C1.09666 9.13 1.93027 9.76673 2.83755 9.64617ZM11.4627 15.0341C12.3751 14.9483 13.0453 14.139 12.9594 13.2265C12.8736 12.314 12.0642 11.6439 11.1518 11.7297C10.2393 11.8156 9.56917 12.6249 9.65502 13.5374C9.74086 14.4498 10.5502 15.12 11.4627 15.0341Z" fill="#1D3B6D" />
  </Svg>
);

const MegaphoneIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 23 24" fill="none">
    <Path fillRule="evenodd" clipRule="evenodd" d="M16.3993 4.60696C16.3998 4.53296 16.4012 4.45821 16.4027 4.38306L16.3993 4.60696ZM3.02298 15.5904C3.02269 15.6041 3.02241 15.6178 3.02213 15.6316L3.02298 15.5904Z" fill="#1D3B6D" />
    <Path fillRule="evenodd" clipRule="evenodd" d="M6.18757 13.9049C6.16296 13.9017 6.13812 13.8985 6.11315 13.8953C5.93832 13.8728 5.75641 13.8516 5.59005 13.8493C5.61394 13.681 5.61155 13.4409 5.60955 13.2405C5.6091 13.1959 5.60868 13.1533 5.60857 13.1139L5.60546 11.9563C5.60496 11.6692 5.60619 11.3775 5.60777 11.0836C5.60813 11.0157 5.60851 10.9478 5.60889 10.8798C5.61327 10.0977 5.61771 9.30459 5.59589 8.54724C5.61853 8.54619 5.64162 8.54517 5.66496 8.54414C5.76271 8.53982 5.86511 8.5353 5.95921 8.52728C8.37682 8.31979 10.6592 7.29573 12.4492 5.61533C12.9114 5.18583 13.3399 4.68658 13.7614 4.19554C13.9271 4.0026 14.0916 3.81092 14.2567 3.62524C14.263 3.61815 14.2692 3.61116 14.2753 3.60427C14.4494 3.40803 14.5499 3.29479 14.8287 3.27109C15.0282 3.31048 15.1693 3.40276 15.2851 3.57121C15.3434 3.85771 15.3374 4.51053 15.3333 4.96363C15.3324 5.06528 15.3315 5.15689 15.3315 5.23204L15.3316 8.08084L15.3315 14.9064C15.3315 15.2319 15.3318 15.5574 15.3322 15.8829C15.3322 15.9364 15.3323 15.9899 15.3323 16.0434C15.3331 16.8457 15.3336 17.648 15.3289 18.4503C15.3263 18.8873 15.218 19.058 14.7766 19.1682C14.6869 19.137 14.5515 19.0826 14.4841 19.0146C14.1598 18.6877 13.8572 18.3408 13.5547 17.9939C13.529 17.9645 13.5033 17.935 13.4776 17.9055C13.0918 17.4636 12.703 17.0245 12.2663 16.6295C11.5569 15.9878 10.8468 15.5249 10.0115 15.0783C9.93589 15.0264 9.58276 14.8571 9.49435 14.8162C8.47869 14.3517 7.39983 14.0491 6.29513 13.9188C6.25988 13.9143 6.22396 13.9097 6.18757 13.9049Z" fill="#1D3B6D" />
    <Path fillRule="evenodd" clipRule="evenodd" d="M4.55279 13.827C4.00114 13.8339 3.44944 13.8338 2.89778 13.8268C2.57259 13.8337 2.1313 13.6024 1.90104 13.3705C1.61435 13.077 1.48401 12.6807 1.48594 12.2708C1.48535 12.077 1.48607 11.8812 1.48711 11.6846C1.48745 11.6191 1.48784 11.5535 1.48822 11.4879C1.48836 11.4633 1.48851 11.4387 1.48865 11.4141C1.49078 11.0452 1.49248 10.6759 1.48736 10.3146C1.4767 9.56425 1.74009 8.96389 2.45547 8.68003C2.74319 8.56585 2.90051 8.56646 3.20523 8.56764L3.22562 8.56772C3.24114 8.56759 3.26549 8.56734 3.29684 8.56701C3.58159 8.56407 4.44354 8.55516 4.50715 8.57901C4.53802 8.8183 4.53711 9.23751 4.5364 9.55898C4.53624 9.63595 4.53608 9.70732 4.53638 9.76927L4.5366 12.44C4.53655 12.5259 4.53548 12.6293 4.53431 12.7417C4.53048 13.111 4.52566 13.5763 4.55279 13.827Z" fill="#1D3B6D" />
    <Path d="M16.0717 2.82829C15.7497 2.4208 15.1112 2.15076 14.6043 2.2117C13.9486 2.37959 13.7087 2.57025 13.2814 3.10391C11.9288 4.7929 10.3042 6.25965 8.2454 6.94765C7.60073 7.16308 6.71962 7.39101 6.03205 7.43867C5.42767 7.47479 4.82225 7.48913 4.21689 7.48164C4.12181 7.48111 4.02708 7.47986 3.93273 7.47863C3.08967 7.46756 2.27791 7.45691 1.53331 7.96054C1.24358 8.1565 1.00388 8.40233 0.824309 8.70744C0.657057 8.99163 0.530856 9.30783 0.471649 9.63484C0.381663 10.1318 0.379784 12.4113 0.495823 12.8847C0.682279 13.6454 1.12984 14.2041 1.78112 14.5993C1.83494 14.632 1.89145 14.6597 1.95 14.6823C1.9444 15.5025 1.94282 16.3226 1.94526 17.1428C1.94534 17.2698 1.94199 17.4045 1.93852 17.5438C1.91957 18.3057 1.89724 19.2037 2.41442 19.7272C3.02982 20.3502 4.00025 20.359 4.61736 19.7315C5.08171 19.2608 5.08011 18.7427 5.07823 18.1363C5.07814 18.1058 5.07804 18.075 5.07801 18.044L5.07719 17.8309C5.07725 17.5697 5.07888 17.3016 5.08052 17.0305C5.08479 16.327 5.08917 15.6037 5.06666 14.9308C5.25159 14.952 5.43991 14.9542 5.6271 14.9564C5.80627 14.9585 5.9844 14.9606 6.1575 14.9793C7.50851 15.1312 8.81333 15.5727 9.98735 16.2753C10.7688 16.7359 11.4851 17.3041 12.1163 17.9641C12.408 18.2718 12.6918 18.5872 12.9675 18.9101C13.0157 18.967 13.064 19.025 13.1126 19.0835C13.6336 19.7103 14.1939 20.3843 15.1131 20.1586C15.8593 19.9753 16.389 19.4168 16.3946 18.6157C16.3951 18.5418 16.3958 18.4668 16.3965 18.3911C16.3979 18.239 16.3993 18.0844 16.3993 17.9323L16.3981 16.4386L16.3973 11.5988L16.3971 6.23064L16.3992 4.6299C16.3995 4.5484 16.4011 4.46601 16.4027 4.38306C16.4131 3.83876 16.4239 3.27399 16.0717 2.82829ZM3.88814 18.9725C3.93383 18.8943 4.00013 18.7808 4.00383 18.6871C4.03067 18.0042 4.02546 17.3185 4.02025 16.6328C4.01591 16.0609 4.01156 15.489 4.02582 14.9189C3.80985 14.9545 3.23384 14.9592 3.02212 14.9243C3.03205 15.1523 3.02755 15.3697 3.02298 15.5904C3.0207 15.7002 3.01841 15.8109 3.01788 15.9241L3.01673 17.7698C3.01673 17.847 3.01482 17.933 3.01283 18.0228C3.00719 18.2772 3.00086 18.5627 3.03504 18.7699C3.09637 19.1415 3.62672 19.2314 3.88814 18.9725Z" fill="#1D3B6D" />
  </Svg>
);

const DateNavArrow = ({
  isNext = false,
  color = '#1D3B6D',
  size = 12,
}: {
  isNext?: boolean;
  color?: string;
  size?: number;
}) => (
  <Svg
    width={size}
    height={size * (21 / 13)}
    viewBox="0 0 13 21"
    fill="none"
    style={isNext ? undefined : { transform: [{ rotate: '180deg' }] }}
  >
    <Path
      d="M1 20L12 10.5L1 1"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PRAYERS_CONFIG: Array<{
  key: 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
  label: string;
  urduLabel: string;
  Icon: React.FC<{ size?: number; color?: string }>;
}> = [
    { key: 'Fajr', label: 'Fajr', urduLabel: 'فجر', Icon: FajrIcon },
    { key: 'Sunrise', label: 'Shuruk', urduLabel: 'شروق', Icon: ShuruqIcon },
    { key: 'Dhuhr', label: 'Dhuhr', urduLabel: 'ظہر', Icon: DhuhrIcon },
    { key: 'Asr', label: 'Asr', urduLabel: 'عصر', Icon: AsrIcon },
    { key: 'Maghrib', label: 'Maghrib', urduLabel: 'مغرب', Icon: MaghribIcon },
    { key: 'Isha', label: 'Isha', urduLabel: 'عشاء', Icon: IshaIcon },
  ];

// ─── MosqueAnnouncementCard ──────────────────────────────────────────────────
interface MosqueAnnouncementCardProps {
  item: Announcement;
  isRtl: boolean;
}

export const MosqueAnnouncementCard: React.FC<MosqueAnnouncementCardProps> = ({ item, isRtl }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const englishText = item.description_en || item.description || '';
  const urduText = item.description_ur || item.description || item.description_en || '';
  const activeContent = isRtl ? (urduText || englishText) : (englishText || urduText);

  const isUrduText = /[\u0600-\u06FF]/.test(activeContent);

  const rawDate = item.event_date || item.created_at;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    : '';

  const isLongText = activeContent.length > 140 || (activeContent.match(/\n/g) || []).length > 2;

  return (
    <View style={styles.sheetAnnouncementCard}>
      {item.category_name ? (
        <View style={[styles.sheetAnnounceBadge, isRtl && styles.alignSelfRight]}>
          <Text style={styles.sheetAnnounceBadgeText}>
            {isRtl ? (item.category_name_ur || item.category_name) : (item.category_name_en || item.category_name)}
          </Text>
        </View>
      ) : null}

      <Text
        style={[
          styles.sheetAnnounceBodyText,
          isUrduText ? styles.sheetAnnounceBodyUrdu : styles.sheetAnnounceBodyEnglish,
        ]}
        numberOfLines={isExpanded ? undefined : 3}
      >
        {activeContent}
      </Text>

      <View style={[styles.sheetAnnounceFooterRow, isRtl && styles.rowReverse]}>
        {isLongText ? (
          <TouchableOpacity
            onPress={() => setIsExpanded((prev) => !prev)}
            activeOpacity={0.7}
            style={styles.sheetAnnounceSeeMoreBtn}
          >
            <Text style={styles.sheetAnnounceSeeMoreText}>
              {isExpanded
                ? (isUrduText ? 'کم دیکھیں...' : 'see less...')
                : (isUrduText ? 'مزید دیکھیں...' : 'see more...')}
            </Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        {formattedDate ? (
          <Text style={styles.sheetAnnounceDateText}>
            {formattedDate}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

// ─── MosqueBottomSheet ─────────────────────────────────────────────────────────
export interface MosqueBottomSheetProps {
  mosque: any;
  isRtl: boolean;
  theme: typeof colors.light;
  onOpenMaps: () => void;
  onClose?: () => void;
}

export const MosqueBottomSheet = memo(
  ({ mosque, isRtl, theme, onOpenMaps, onClose }: MosqueBottomSheetProps) => {
    const { language } = useApp();
    const {
      timings: todayTimings,
      hijriDate: todayHijriDate,
      gregorianDate: todayGregorianDate,
      upcoming,
    } = usePrayerTimes(language);

    const [activeTab, setActiveTab] = useState<'prayers' | 'announcements'>('prayers');
    const [dayOffset, setDayOffset] = useState(0);
    const [offsetCache, setOffsetCache] = useState<Record<number, PrayerTimesResult>>({});
    const [loadingTimings, setLoadingTimings] = useState(false);

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

    // Fetch announcements for this mosque
    useEffect(() => {
      if (!mosque?.id) return;
      setLoadingAnnouncements(true);
      announcementService
        .fetchAnnouncementsByMosque(mosque.id)
        .then((data) => {
          setAnnouncements(data || []);
        })
        .catch((err) => {
          console.warn('[MosqueBottomSheet] fetch announcements error:', err);
          setAnnouncements([]);
        })
        .finally(() => {
          setLoadingAnnouncements(false);
        });
    }, [mosque?.id]);

    const masjidLat = mosque.latitude;
    const masjidLng = mosque.longitude;

    // Seed today's cache once available
    useEffect(() => {
      if (todayTimings && todayHijriDate && todayGregorianDate) {
        setOffsetCache((prev) => {
          if (prev[0]) return prev;
          return {
            ...prev,
            0: {
              timings: todayTimings,
              hijriDate: todayHijriDate,
              gregorianDate: todayGregorianDate,
              city: mosque.city || '',
            },
          };
        });
      }
    }, [todayTimings, todayHijriDate, todayGregorianDate, mosque.city]);

    // Fetch prayer times for dayOffset if not in cache
    useEffect(() => {
      if (dayOffset === 0 && (offsetCache[0] || todayTimings)) return;
      if (offsetCache[dayOffset]) return;
      if (!masjidLat || !masjidLng) return;

      setLoadingTimings(true);
      const target = new Date();
      target.setDate(target.getDate() + dayOffset);

      fetchPrayerTimes(masjidLat, masjidLng, 1, language, target, mosque.city || undefined)
        .then((res) => {
          setOffsetCache((prev) => ({ ...prev, [dayOffset]: res }));
        })
        .catch((err) => {
          console.warn('[MosqueBottomSheet] fetch prayer error:', err);
        })
        .finally(() => {
          setLoadingTimings(false);
        });
    }, [dayOffset, masjidLat, masjidLng, language, mosque.city, offsetCache, todayTimings]);

    // Background prefetch +/- 7 days for the mosque
    const prefetchDoneRef = useRef(false);
    useEffect(() => {
      if (masjidLat && masjidLng && !prefetchDoneRef.current) {
        prefetchDoneRef.current = true;
        const offsets = [-1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6, -7, 7];
        (async () => {
          for (const off of offsets) {
            const target = new Date();
            target.setDate(target.getDate() + off);
            try {
              const res = await fetchPrayerTimes(
                masjidLat,
                masjidLng,
                1,
                language,
                target,
                mosque.city || undefined
              );
              setOffsetCache((prev) => ({ ...prev, [off]: res }));
            } catch { }
          }
        })();
      }
    }, [masjidLat, masjidLng, language, mosque.city]);

    const currentResult: PrayerTimesResult | null = useMemo(() => {
      if (dayOffset === 0) {
        if (offsetCache[0]) return offsetCache[0];
        if (todayTimings) {
          return {
            timings: todayTimings,
            hijriDate: todayHijriDate,
            gregorianDate: todayGregorianDate,
            city: mosque.city || '',
          };
        }
        return null;
      }
      return offsetCache[dayOffset] || null;
    }, [dayOffset, offsetCache, todayTimings, todayHijriDate, todayGregorianDate, mosque.city]);

    // Formatted Gregorian Date
    const displayGregorian = useMemo(() => {
      if (currentResult?.gregorianDate) {
        return currentResult.gregorianDate;
      }
      const target = new Date();
      if (dayOffset !== 0) {
        target.setDate(target.getDate() + dayOffset);
      }
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      return `${dayNames[target.getDay()]}, ${target.getDate()} ${monthNames[target.getMonth()]} ${target.getFullYear()}`;
    }, [currentResult, dayOffset]);

    // Formatted Hijri Date
    const displayHijri = useMemo(() => {
      if (currentResult?.hijriDate) {
        return currentResult.hijriDate.replace(' AH', '').trim();
      }
      if (dayOffset === 0 && todayHijriDate) {
        return todayHijriDate.replace(' AH', '').trim();
      }
      return '';
    }, [currentResult, dayOffset, todayHijriDate]);

    const formatShortTime = (timeStr?: string) => {
      if (!timeStr) return '00:00';
      const cleanStr = timeStr.trim();
      const parts = cleanStr.split(' ');
      const timePortion = parts[0];
      const [hStr, mStr] = timePortion.split(':');
      let hNum = parseInt(hStr, 10);
      const m = mStr || '00';
      if (isNaN(hNum)) return '00:00';
      return `${hNum.toString().padStart(2, '0')}:${m}`;
    };

    const isHighlighted = (prayerKey: string) => {
      if (dayOffset !== 0) return false;
      if (upcoming?.name) return upcoming.name === prayerKey;
      return prayerKey === 'Fajr';
    };

    const handleShare = async () => {
      try {
        await Share.share({
          message: `Check out ${mosque.name} located at ${mosque.address}. Open in Mosque Locator App!`,
        });
      } catch (error) {
        console.error(error);
      }
    };

    return (
      <View style={styles.sheetWrapper}>
        <View style={styles.sheetScroll}>
          {/* Header Image if present */}
          {mosque.image_url ? (
            <View style={styles.sheetImageContainer}>
              <Image source={{ uri: mosque.image_url }} style={styles.sheetImage} />
              <LinearGradient
                colors={['transparent', 'rgba(250, 254, 255, 0.5)', '#FAFEFF']}
                style={styles.sheetImageGradient}
              />
              <View style={styles.overlaidTextContainer}>
                <Text style={[styles.sheetTitleOverlaid, { color: theme.text }]} numberOfLines={2}>
                  {mosque.name}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.sheetNoImageHeader}>
              <View style={styles.noImageTextContainer}>
                <Text style={[styles.sheetTitle, { color: theme.text }]}>
                  {mosque.name}
                </Text>
              </View>
            </View>
          )}

          {/* Absolute overlay close/share buttons - top right */}
          <View style={styles.topRightFloatingActions}>
            <TouchableOpacity onPress={handleShare} style={styles.circularFloatBtn} activeOpacity={0.5}>
              <ShareSvgIcon />
            </TouchableOpacity>
            {onClose ? (
              <TouchableOpacity onPress={onClose} style={[styles.circularFloatBtn, { marginLeft: 8 }]} activeOpacity={0.5}>
                <CrossSvgIcon />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Main Info Area */}
          <View style={styles.mosqueDetailsContainer}>
            {/* Direction Button */}
            <TouchableOpacity
              style={styles.directionBtn}
              onPress={onOpenMaps}
              activeOpacity={0.8}
            >
              <RedirectSvgIcon />
              <Text style={styles.directionBtnText}>{isRtl ? 'سمت' : 'Direction'}</Text>
            </TouchableOpacity>

            <Text style={[styles.addressTextRedesigned, { color: theme.text }]}>
              {`📍${mosque.address || ''}${mosque.city ? ', ' + mosque.city : ''}.`}
            </Text>

            {/* Capacity Info if present */}
            {mosque.capacity ? (
              <View style={styles.capacityInlineRow}>
                <Users size={16} color={colors.primary} />
                <Text style={[styles.capacityInlineText, { color: theme.textMuted }]}>
                  {isRtl ? `گنجائش: ${mosque.capacity} افراد` : `Capacity: ${mosque.capacity} People`}
                </Text>
              </View>
            ) : null}

            {/* Tabs Row */}
            <View style={[styles.outlineButtonsRow, isRtl && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity
                style={[
                  styles.outlineCardBtn,
                  activeTab === 'prayers' && styles.outlineCardBtnActive,
                  isRtl && { alignItems: 'flex-end' },
                ]}
                onPress={() => setActiveTab('prayers')}
                activeOpacity={0.8}
              >
                <View style={[styles.outlineBtnContent, isRtl && { flexDirection: 'row-reverse' }]}>
                  <PrayerPeopleSvgIcon />
                  <Text style={[styles.outlineBtnText, { color: theme.text }]}>{isRtl ? 'نماز' : 'Prayers'}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.outlineCardBtn,
                  activeTab === 'announcements' && styles.outlineCardBtnActive,
                  isRtl && { alignItems: 'flex-end' },
                ]}
                onPress={() => setActiveTab('announcements')}
                activeOpacity={0.8}
              >
                <View style={[styles.outlineBtnContent, isRtl && { flexDirection: 'row-reverse' }]}>
                  <MegaphoneIcon />
                  <Text style={[styles.outlineBtnText, { color: theme.text }]}>
                    {isRtl ? 'اعلانات' : 'Announcement'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Prayer Times Section */}
            {activeTab === 'prayers' && (
              <View style={styles.sheetPrayerSection}>
                <View style={styles.sheetDateNavigatorRow}>
                  <TouchableOpacity
                    onPress={() => setDayOffset((prev) => Math.max(prev - 1, -7))}
                    style={[styles.sheetDateArrowBtn, dayOffset <= -7 && { opacity: 0.35 }]}
                    disabled={dayOffset <= -7}
                    activeOpacity={0.7}
                    accessibilityLabel="Previous Day"
                  >
                    <DateNavArrow isNext={false} size={14} color="#1D3B6D" />
                  </TouchableOpacity>

                  <View style={styles.sheetDateTextWrapper}>
                    <Text style={styles.sheetGregorianDateText} numberOfLines={1}>
                      {displayGregorian}
                    </Text>
                    {displayHijri ? (
                      <Text style={styles.sheetHijriDateText} numberOfLines={1}>
                        {displayHijri}
                      </Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    onPress={() => setDayOffset((prev) => Math.min(prev + 1, 7))}
                    style={[styles.sheetDateArrowBtn, dayOffset >= 7 && { opacity: 0.35 }]}
                    disabled={dayOffset >= 7}
                    activeOpacity={0.7}
                    accessibilityLabel="Next Day"
                  >
                    <DateNavArrow isNext={true} size={14} color="#1D3B6D" />
                  </TouchableOpacity>
                </View>

                <View style={[styles.prayerTimesHCard, isRtl && { flexDirection: 'row-reverse' }]}>
                  {PRAYERS_CONFIG.map((p, index) => {
                    const rawTime = currentResult?.timings
                      ? (currentResult.timings as any)[p.key]
                      : undefined;
                    const formatted = formatShortTime(rawTime);
                    const active = isHighlighted(p.key);
                    const prevActive = index > 0 && isHighlighted(PRAYERS_CONFIG[index - 1].key);

                    return (
                      <React.Fragment key={p.key}>
                        {index > 0 && !active && !prevActive && (
                          <View style={styles.prayerHDivider} />
                        )}
                        <View style={[styles.prayerHColumn, active && styles.prayerHColumnActive]}>
                          <Text style={[styles.prayerHName, active && styles.prayerHNameActive]}>
                            {isRtl ? p.urduLabel : p.label}
                          </Text>
                          <View style={styles.prayerHIconWrap}>
                            <p.Icon size={24} color="#1D3B6D" />
                          </View>
                          <Text style={[styles.prayerHTime, active && styles.prayerHTimeActive]}>
                            {loadingTimings && !rawTime ? '..' : formatted}
                          </Text>
                        </View>
                      </React.Fragment>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Announcements Section */}
            {activeTab === 'announcements' && (
              <View style={styles.sheetAnnouncementSection}>
                {loadingAnnouncements ? (
                  <View style={styles.sheetAnnounceLoadingWrap}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : announcements.length === 0 ? (
                  <View style={styles.sheetAnnounceEmptyWrap}>
                    <Text style={styles.sheetAnnounceEmptyTitle}>
                      {isRtl ? 'کوئی اعلان موجود نہیں' : 'No Announcements'}
                    </Text>
                    <Text style={styles.sheetAnnounceEmptySub}>
                      {isRtl
                        ? 'اس مسجد کا فی الحال کوئی فعال اعلان دستیاب نہیں ہے۔'
                        : 'No active announcements available for this mosque.'}
                    </Text>
                  </View>
                ) : (
                  announcements.map((item) => (
                    <MosqueAnnouncementCard
                      key={item.id}
                      item={item}
                      isRtl={isRtl}
                    />
                  ))
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  sheetWrapper: { flex: 1, width: '100%' },
  sheetScroll: { flex: 1, width: '100%', paddingHorizontal: 2, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  sheetScrollContent: { paddingBottom: 80 },
  mosqueDetailsContainer: { paddingHorizontal: spacing.md, paddingTop: 10 },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D3B6D',
    lineHeight: 26,
    flex: 1,
  },
  sheetImageContainer: {
    width: '100%',
    height: 300,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetImage: {
    width: '100%',
    height: '100%',
    aspectRatio: 16 / 9,
    resizeMode: 'stretch',
  },
  sheetImageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
    zIndex: 2,
  },
  overlaidTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    zIndex: 5,
  },
  sheetTitleOverlaid: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 26,
    marginBottom: 8,
    paddingRight: 60,
  },
  directionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  directionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sheetNoImageHeader: {
    width: '100%',
    paddingTop: 24,
    paddingHorizontal: spacing.lg,
    position: 'relative',
  },
  noImageTextContainer: {
    paddingRight: 80,
  },
  topRightFloatingActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    zIndex: 15,
  },
  circularFloatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAFEFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressTextRedesigned: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1D3B6D',
    marginBottom: 16,
    fontWeight: '500',
  },
  capacityInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  capacityInlineText: {
    fontSize: 14,
    fontWeight: '500',
  },
  outlineButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  outlineCardBtn: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#03BECD',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
  },
  outlineCardBtnActive: {
    backgroundColor: '#D0F3F9',
    borderColor: '#03BECD',
  },
  outlineBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sheetPrayerSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  sheetDateNavigatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 2,
    marginBottom: 14,
  },
  sheetDateArrowBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDateTextWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  sheetGregorianDateText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1D3B6D',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  sheetHijriDateText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1D3B6D',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  prayerTimesHCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#D7F5F8',
    borderWidth: 1.5,
    borderColor: '#73DBE6',
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingVertical: 10,
    marginBottom: 12,
  },
  prayerHColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  prayerHColumnActive: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  prayerHName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D3B6D',
    marginBottom: 3,
    textAlign: 'center',
  },
  prayerHNameActive: {
    color: '#1D3B6D',
    fontWeight: '800',
  },
  prayerHIconWrap: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 3,
  },
  prayerHTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D3B6D',
    marginTop: 3,
    textAlign: 'center',
  },
  prayerHTimeActive: {
    color: '#1D3B6D',
    fontWeight: '800',
  },
  prayerHDivider: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(3, 190, 205, 0.35)',
  },
  sheetAnnouncementSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  sheetAnnouncementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#D8F3FA',
    padding: 14,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
    }),
  },
  sheetAnnounceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1F3F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  sheetAnnounceBadgeText: {
    color: '#153258',
    fontSize: 11,
    fontWeight: '700',
  },
  sheetAnnounceBodyText: {
    color: '#1B365D',
    letterSpacing: 0.1,
  },
  sheetAnnounceBodyEnglish: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'left',
  },
  sheetAnnounceBodyUrdu: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },
  sheetAnnounceFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#EEF2F6',
  },
  sheetAnnounceSeeMoreBtn: {
    paddingVertical: 2,
  },
  sheetAnnounceSeeMoreText: {
    fontSize: 12,
    color: '#03BECD',
    fontWeight: '700',
  },
  sheetAnnounceDateText: {
    fontSize: 11,
    color: '#8C9199',
    fontWeight: '600',
  },
  sheetAnnounceLoadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetAnnounceEmptyWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8F3FA',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  sheetAnnounceEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D3B6D',
    marginBottom: 6,
    textAlign: 'center',
  },
  sheetAnnounceEmptySub: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  alignSelfRight: {
    alignSelf: 'flex-end',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
});
