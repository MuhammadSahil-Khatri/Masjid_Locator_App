import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { X, Check } from 'lucide-react-native';

import { Text } from '../../components/ui/Text';
import { colors, spacing, typography } from '../../theme';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '../../navigation/NavigationContext';

// ─── SVG Icons Matching Assets ────────────────────────────────────────────────

const BackArrowIcon = ({ color = '#1D3B6D', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size * (21 / 13)} viewBox="0 0 13 21" fill="none">
    <Path d="M12 20L1 10.5L12 1" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const NextArrowIcon = ({ color = '#1D3B6D', size = 16, isRtl = false }: { color?: string; size?: number; isRtl?: boolean }) => (
  <Svg width={size * (13 / 21)} height={size} viewBox="0 0 13 21" fill="none">
    <Path
      d={isRtl ? "M12 20L1 10.5L12 1" : "M0.999999 20L12 10.5L1 1"}
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ProfileSvgIcon = ({ color = '#1D3B6D', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size * (13 / 19)} height={size} viewBox="0 0 13 19" fill="none">
    <Path
      d="M6.17488 8.10417C6.92624 8.10417 7.66072 7.86652 8.28544 7.42127C8.91017 6.97603 9.39709 6.34318 9.68462 5.60275C9.97215 4.86233 10.0474 4.04759 9.9008 3.26157C9.75421 2.47554 9.3924 1.75352 8.86112 1.18683C8.32983 0.620136 7.65293 0.234212 6.91601 0.0778615C6.1791 -0.0784891 5.41526 0.00175573 4.7211 0.308449C4.02695 0.615141 3.43364 1.13451 3.01621 1.80087C2.59878 2.46723 2.37598 3.25066 2.37598 4.05209C2.37698 5.12644 2.77755 6.15648 3.48976 6.91616C4.20198 7.67584 5.16766 8.1031 6.17488 8.10417Z"
      fill={color}
    />
    <Path
      d="M3.70616 9.75033C3.03096 10.0867 2.404 10.5497 1.86607 11.1234C0.756814 12.3066 0.100167 13.8736 0 15.5317C0.370987 15.8839 0.782783 16.2004 1.202 16.4933C2.76756 17.5854 4.6225 18.2344 6.63325 18.2344C7.81299 18.2344 8.94079 18.0128 9.99068 17.6131C10.6399 17.3638 11.2557 17.0433 11.8382 16.6634C12.1721 16.4458 12.5023 16.2123 12.8065 15.9551C12.8028 14.1427 12.1276 12.4056 10.9256 11.1234C9.72357 9.84134 8.09494 9.12114 6.39582 9.11719C5.45722 9.12114 4.54088 9.33879 3.70616 9.75033Z"
      fill={color}
    />
  </Svg>
);

const SecureSvgIcon = ({ color = '#1D3B6D', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
    <Path
      d="M1.80927 7.66193C1.88161 7.65927 1.95396 7.65759 2.02634 7.65692L11.7272 7.65666L14.5563 7.65633L15.3634 7.65625C16.0739 7.65644 16.5865 7.68409 17.1259 8.21375C17.3626 8.44627 17.5326 8.7359 17.6189 9.05345C17.7127 9.40174 17.6884 9.86654 17.6884 10.2376L17.6878 11.4319C16.6385 11.4497 15.5399 11.4339 14.4879 11.4339L8.31401 11.4341H6.04371C5.62643 11.4339 4.95607 11.4121 4.5708 11.4776C4.11462 11.5577 3.69461 11.7737 3.36784 12.0961C3.07175 12.3856 2.86268 12.7496 2.76357 13.1479C2.66168 13.5538 2.69361 14.3541 2.69384 14.8025L2.6935 16.9959C2.69336 17.2205 2.68646 17.4985 2.70937 17.7182C2.76749 18.2291 3.00184 18.7053 3.37357 19.0678C4.06429 19.74 4.71722 19.7304 5.60129 19.7304L6.78411 19.7298L13.9068 19.7295C15.1562 19.7295 16.4401 19.7143 17.6872 19.7329C17.6932 20.3512 17.6747 20.7641 17.2629 21.2836C16.9673 21.6564 16.4522 21.947 15.9724 21.9854C15.7106 22.0063 15.3498 21.998 15.0776 21.998L13.5158 21.9979H8.4955L3.94457 21.9977L2.57256 21.9987C2.3084 21.9989 1.94402 22.0089 1.68923 21.9796C1.32504 21.9365 0.981429 21.7907 0.700039 21.5597C0.31083 21.239 0.0528074 20.7865 0.0122875 20.2876C-0.007027 20.0498 0.00211606 19.7478 0.00246328 19.5054L0.00263148 18.2412L0.00258821 14.1455L0.00246923 10.9222L0.00161988 9.98213C0.00144567 9.75223 -0.00572099 9.49663 0.0250036 9.27065C0.0749141 8.91883 0.226717 8.58847 0.462369 8.31883C0.816591 7.90895 1.26949 7.70592 1.80927 7.66193Z"
      fill={color}
    />
    <Path
      d="M4.76461 11.971C5.08931 11.9524 5.51954 11.9653 5.8495 11.9653L7.83875 11.9654L13.9643 11.9655L18.446 11.9653H19.8173C20.0463 11.9653 20.4045 11.9547 20.6249 11.9776C20.91 12.0084 21.1807 12.1239 21.4051 12.3105C21.7276 12.5737 21.9325 12.9641 21.9719 13.3899C21.9934 13.6006 21.9854 13.8944 21.9855 14.1131L21.9858 15.2719L21.9857 16.7486C21.9855 17.3915 22.0649 18.0247 21.6325 18.5466C21.3439 18.8949 21.0167 19.0769 20.579 19.1231C20.2129 19.1404 19.7795 19.1299 19.4092 19.1299L17.3601 19.1301H11.0743L6.83788 19.1299L5.52001 19.1304C5.28161 19.1307 4.95685 19.1403 4.72838 19.118C4.42665 19.09 4.14007 18.9672 3.90617 18.766C3.59707 18.503 3.40032 18.1226 3.35906 17.7082C3.33949 17.5139 3.34874 17.1541 3.34868 16.947L3.34897 15.5525L3.34861 14.1998C3.34819 13.9066 3.32649 13.5397 3.37829 13.256C3.51427 12.5116 4.07048 12.0435 4.76461 11.971ZM6.57919 14.8643C6.41965 14.7415 6.10541 14.534 5.90493 14.5644C5.80561 14.579 5.71703 14.6375 5.66161 14.7249C5.60405 14.8143 5.58306 14.9239 5.6033 15.0295C5.66674 15.3568 6.10206 15.4133 6.17287 15.5399C6.09913 15.6907 5.44259 15.8176 5.61774 16.2729C5.69648 16.4776 5.8982 16.5919 6.09931 16.5086C6.25754 16.443 6.43358 16.3265 6.58017 16.236C6.57945 16.5656 6.50406 17.1605 6.98368 17.1307C7.00104 17.1293 7.01836 17.1275 7.03559 17.125C7.42476 17.0089 7.34131 16.5695 7.34443 16.2318C7.51983 16.3516 7.8285 16.5751 8.03721 16.525C8.13716 16.5001 8.2228 16.4331 8.27378 16.3399C8.32688 16.2442 8.33973 16.1298 8.30928 16.0239C8.24273 15.795 7.91179 15.6745 7.72068 15.5388C7.8877 15.4601 8.23775 15.267 8.3035 15.0837C8.3395 14.9828 8.33382 14.8708 8.28782 14.7745C8.24253 14.6786 8.16103 14.6069 8.06299 14.5766C7.85803 14.5128 7.53413 14.7122 7.37551 14.8455C7.35567 14.8374 7.35201 14.8392 7.34932 14.8232C7.30548 14.5614 7.43898 14.1413 7.12915 14.0002C7.05634 13.9672 6.95663 13.9584 6.86727 13.9704C6.49315 14.0856 6.5872 14.54 6.57919 14.8643ZM10.3824 14.8643C10.221 14.7413 9.90973 14.5338 9.70818 14.5644C9.60885 14.579 9.52027 14.6374 9.46486 14.7249C9.4073 14.8143 9.3863 14.9239 9.40655 15.0295C9.46997 15.3567 9.90542 15.4135 9.97594 15.5397C9.90536 15.6861 9.23979 15.8287 9.41955 16.2687C9.62917 16.7819 10.093 16.4154 10.3834 16.236C10.3827 16.5656 10.3073 17.1604 10.7869 17.1307C10.8043 17.1295 10.8216 17.1275 10.8389 17.125C11.2276 17.009 11.1449 16.5694 11.1476 16.2318C11.3231 16.3515 11.6317 16.5751 11.8404 16.525C11.9404 16.5001 12.0261 16.4331 12.0771 16.3399C12.1302 16.2442 12.143 16.1298 12.1126 16.0239C12.046 15.7951 11.715 15.6745 11.5239 15.5388C11.6909 15.4601 12.041 15.2668 12.1068 15.0837C12.1428 14.9828 12.1371 14.8708 12.0911 14.7745C12.0458 14.6786 11.9643 14.6069 11.8662 14.5766C11.6613 14.5128 11.3374 14.7122 11.1788 14.8455C11.1589 14.8374 11.1552 14.8392 11.1526 14.8232C11.1088 14.5614 11.2422 14.1414 10.9324 14.0003C10.8597 13.9672 10.7598 13.9584 10.6706 13.9704C10.2964 14.0856 10.3905 14.54 10.3824 14.8643ZM18.2771 13.9704C17.9028 14.0857 17.9971 14.54 17.9889 14.8643C17.8275 14.7413 17.5162 14.5338 17.3147 14.5644C17.2154 14.579 17.1268 14.6374 17.0713 14.7249C17.0138 14.8143 16.9929 14.9239 17.0131 15.0295C17.0765 15.3568 17.5118 15.4133 17.5826 15.5399C17.509 15.6907 16.8523 15.8177 17.0275 16.2729C17.1063 16.4776 17.3079 16.5919 17.509 16.5086C17.6672 16.443 17.8434 16.3265 17.9899 16.236C17.9892 16.5656 17.9137 17.1604 18.3934 17.1307C18.4108 17.1293 18.4281 17.1275 18.4454 17.125C18.8341 17.009 18.7514 16.5694 18.7541 16.2318C18.9297 16.3515 19.2383 16.5752 19.447 16.525C19.5469 16.5 19.6325 16.433 19.6834 16.3399C19.7367 16.2442 19.7495 16.1298 19.7191 16.0239C19.6525 15.7947 19.3218 15.6748 19.1304 15.5388C19.2974 15.4601 19.6475 15.267 19.7133 15.0837C19.7493 14.9828 19.7436 14.8708 19.6976 14.7745C19.6523 14.6786 19.5708 14.6069 19.4727 14.5766C19.2678 14.5128 18.9439 14.7122 18.7853 14.8455C18.7653 14.8375 18.7617 14.8394 18.759 14.8232C18.7154 14.5614 18.8486 14.1414 18.5389 14.0003C18.4662 13.9672 18.3663 13.9584 18.2771 13.9704ZM14.4738 13.9704C14.0998 14.0856 14.1938 14.5389 14.1857 14.8631C13.9449 14.6867 13.4993 14.369 13.269 14.7234C13.2096 14.8148 13.1887 14.9276 13.2113 15.0356C13.2527 15.2313 13.3864 15.2914 13.5362 15.3829C13.5893 15.4154 13.7443 15.4945 13.779 15.5369C13.731 15.6667 13.0036 15.8462 13.2376 16.3118C13.2911 16.4182 13.3355 16.4591 13.4422 16.5062C13.6693 16.6063 13.9894 16.3582 14.1867 16.2359C14.186 16.5655 14.1105 17.1604 14.5902 17.1307C14.6075 17.1293 14.6249 17.1275 14.6421 17.125C15.0309 17.009 14.9481 16.5694 14.9509 16.2318C15.1264 16.3516 15.435 16.5751 15.6437 16.5249C15.7436 16.5001 15.8293 16.4331 15.8803 16.3399C15.9334 16.2442 15.9463 16.1298 15.9158 16.0239C15.8493 15.795 15.5183 15.6745 15.3272 15.5388C15.4943 15.4601 15.8442 15.267 15.91 15.0837C15.9461 14.9828 15.9404 14.8708 15.8943 14.7744C15.8487 14.6784 15.7669 14.6067 15.6686 14.5763C15.4636 14.5143 15.1403 14.7116 14.982 14.8455C14.9622 14.8374 14.9585 14.8392 14.9559 14.8232C14.9119 14.5614 15.0456 14.1415 14.7356 14.0003C14.6628 13.9672 14.5632 13.9584 14.4738 13.9704Z"
      fill={color}
    />
    <Path
      d="M8.35532 0.00471491C8.44535 0.00026345 8.54482 4.75906e-05 8.63526 0C10.0224 0.00712814 11.35 0.558007 12.3272 1.53186C13.2053 2.40103 13.7425 3.55069 13.8428 4.7755C13.8672 5.06199 13.8625 5.33464 13.8626 5.62184L13.8622 6.68678C12.9915 6.69796 12.1038 6.68873 11.2317 6.68868C11.2453 6.25753 11.2244 5.81784 11.2338 5.38685C11.2487 4.69674 11.074 4.07197 10.6207 3.53666C10.1795 3.00801 9.5417 2.67732 8.85115 2.6192C8.78124 2.60963 8.68498 2.60591 8.61506 2.60587C7.90668 2.60073 7.22637 2.87957 6.72928 3.37878C6.31099 3.79765 6.05095 4.34597 5.99272 4.93189C5.96945 5.16408 5.97562 5.42422 5.97563 5.65941L5.97613 6.68678C5.11313 6.70179 4.2116 6.68871 3.34566 6.68868C3.36457 6.1105 3.32511 5.4929 3.3561 4.91489C3.41879 3.75158 3.87577 2.64307 4.65336 1.7681C5.63016 0.679874 6.89234 0.0926983 8.35532 0.00471491Z"
      fill={color}
    />
  </Svg>
);

const FeedbackSvgIcon = ({ color = '#1D3B6D', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size * (21 / 22)} viewBox="0 0 22 21" fill="none">
    <Path
      d="M0 4.63294C0.0544652 4.52047 0.0896816 4.21999 0.144841 4.06483C0.409661 3.31994 0.961572 2.70887 1.69588 2.40898C1.94633 2.30611 2.21045 2.24026 2.47988 2.2135C2.81323 2.18308 3.37181 2.2 3.72064 2.20003L5.96705 2.20018L12.9775 2.20019L15.2551 2.20027C15.5947 2.20031 16.0433 2.21589 16.3712 2.20035C16.1462 2.40171 15.8264 2.74434 15.6046 2.96623L14.0376 4.5325L13.0106 5.55891C12.7962 5.77326 12.5629 5.98236 12.3853 6.22693C12.0428 6.7038 12.1067 7.24688 12.1013 7.792C12.0952 8.40465 12.0883 8.86478 12.5233 9.3495C13.0829 9.973 13.6684 9.89566 14.4206 9.90117C15.0358 9.90567 15.5183 9.90071 15.9962 9.43555C16.3064 9.13626 16.6223 8.81183 16.9318 8.50273L18.8405 6.59392L20.2245 5.21028L20.6599 4.77627C20.7363 4.70051 20.8405 4.60458 20.9091 4.52564L20.907 4.54447C20.8876 4.73418 20.9037 5.17552 20.9037 5.38714L20.9033 7.15635L20.903 12.9071L20.9036 14.1824C20.9036 14.6144 20.9264 15.0668 20.8285 15.4867C20.6892 16.0674 20.3652 16.5873 19.9051 16.9682C19.5578 17.2581 19.1447 17.4581 18.702 17.5512C18.3352 17.6258 18.0228 17.6132 17.6534 17.613L16.7258 17.6127L14.3184 17.6123C13.8211 17.6094 13.3238 17.6113 12.8265 17.618C12.6921 17.7049 12.5381 17.8267 12.4072 17.9249L11.7039 18.4527L9.55251 20.0656L8.9009 20.5551C8.67432 20.7261 8.44418 20.9592 8.13847 20.8916C7.99063 20.8587 7.86177 20.7687 7.78001 20.6413C7.68103 20.4867 7.70178 20.2216 7.70058 20.0439C7.69509 19.2339 7.70858 18.4219 7.69949 17.612C7.36888 17.62 7.01572 17.6126 6.68287 17.6125H4.73194L3.46768 17.6128C3.00743 17.613 2.57443 17.6365 2.12272 17.5325C1.64819 17.4205 1.21209 17.1842 0.859288 16.8476C0.496329 16.5046 0.233136 16.0697 0.0977017 15.589C0.0705216 15.4908 0.0298517 15.2233 0 15.1589V4.63294ZM16.9953 13.2018C17.1836 13.1938 17.326 13.1659 17.4605 13.0141C17.5589 12.905 17.6086 12.7603 17.5979 12.6137C17.5874 12.4652 17.5171 12.3272 17.4031 12.2314C17.3012 12.1462 17.1987 12.1176 17.0692 12.1142C16.8441 12.1082 16.6133 12.1113 16.388 12.1113L15.1017 12.1114L11.1285 12.1115L6.33446 12.1114H4.76985C4.49866 12.1114 4.17369 12.1032 3.90578 12.1148C3.79922 12.1168 3.73577 12.1136 3.63456 12.1534C3.40646 12.2429 3.29205 12.457 3.30712 12.6957C3.31547 12.8407 3.38359 12.9759 3.49525 13.0688C3.63198 13.1839 3.77202 13.1998 3.94449 13.2025C4.08657 13.2047 4.22915 13.203 4.37126 13.2029L5.33103 13.2022H8.32041L16.9953 13.2018ZM9.41456 9.89339C9.92191 9.81816 10.076 9.19449 9.65393 8.89417C9.59106 8.84944 9.48526 8.82307 9.40926 8.81261C9.07611 8.80174 8.73236 8.80608 8.3992 8.8062L6.46769 8.80631L4.72083 8.8061C4.46978 8.80592 3.99855 8.7927 3.76101 8.81489C3.60155 8.85025 3.48214 8.90953 3.3897 9.05492C3.30892 9.18305 3.28371 9.33854 3.31989 9.48565C3.35806 9.639 3.45194 9.75425 3.587 9.83254L3.61909 9.85148C3.75075 9.92767 4.91237 9.90089 5.15057 9.90079L7.49378 9.90075L8.78098 9.90082C8.92649 9.9008 9.28605 9.91012 9.41456 9.89339ZM9.32988 6.59835C9.65766 6.57864 9.92159 6.35961 9.89572 6.01152C9.88488 5.86384 9.81537 5.72665 9.70272 5.63054C9.60311 5.54594 9.50709 5.5218 9.38035 5.51376C9.13256 5.49806 8.86855 5.50477 8.61959 5.50476L7.22155 5.50464L5.01758 5.50456C4.6631 5.50456 4.238 5.49383 3.88833 5.50628C3.71515 5.5203 3.55277 5.54562 3.43614 5.68856C3.14905 6.04042 3.35671 6.57665 3.82572 6.59324C4.04284 6.60092 4.25171 6.59957 4.46615 6.59956L5.68715 6.59909L9.32988 6.59835Z"
      fill={color}
    />
    <Path
      d="M22.0006 1.75622C21.9211 1.88821 21.9586 1.91217 21.8112 2.06328C21.64 2.23874 21.4652 2.41096 21.2917 2.58385L20.3557 3.51954L17.3902 6.48519L15.9132 7.9617C15.6687 8.20632 15.2539 8.72297 14.9106 8.79342C14.827 8.8106 14.6787 8.8048 14.597 8.80338C13.7356 8.78825 13.0947 8.99868 13.1985 7.82626C13.2324 6.74197 13.0832 7.02675 13.8824 6.22821L14.7765 5.3348L17.4919 2.61913L19.1028 1.0086C19.2719 0.839608 19.9492 0.132651 20.0998 0.0575977C20.2364 -0.00949127 20.3945 -0.0183574 20.5379 0.0330225C20.7713 0.115106 21.2078 0.656248 21.4157 0.834333C21.5648 0.962103 21.7405 1.16834 21.8845 1.31117C21.9167 1.34323 21.9759 1.48598 22.0006 1.53667V1.75622Z"
      fill={color}
    />
  </Svg>
);



const PrivacyPolicySvgIcon = ({ color = '#1D3B6D', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0 2.3571C0 1.06384 1.06855 0 2.3571 0H19.6425C20.931 0 21.9996 1.06541 21.9996 2.3571V6.8403C21.9996 13.3396 18.0554 19.4209 11.9253 21.8126C11.6279 21.934 11.3101 21.998 10.9888 22.0011C10.6749 21.995 10.3649 21.9311 10.0742 21.8126C3.94421 19.4209 0 13.3396 0 6.8403V2.3571ZM16.594 7.08386C16.7041 6.96955 16.79 6.83418 16.8465 6.68585C16.903 6.53753 16.929 6.37932 16.9229 6.22071C16.9168 6.0621 16.8787 5.90636 16.8109 5.76283C16.7431 5.61931 16.647 5.49095 16.5284 5.38547C16.4098 5.27999 16.2711 5.19956 16.1206 5.149C15.9702 5.09844 15.8111 5.07879 15.6528 5.09124C15.4946 5.10368 15.3405 5.14797 15.1998 5.22143C15.0591 5.29489 14.9347 5.39602 14.834 5.51875L9.2681 11.7792L6.99272 10.0727C6.86891 9.9798 6.72801 9.91223 6.57808 9.87382C6.42816 9.83541 6.27213 9.82691 6.11892 9.8488C5.96571 9.87068 5.8183 9.92253 5.68513 10.0014C5.55195 10.0802 5.43561 10.1846 5.34275 10.3084C5.24989 10.4322 5.18233 10.5731 5.14392 10.723C5.1055 10.8729 5.097 11.029 5.11889 11.1822C5.14078 11.3354 5.19263 11.4828 5.27148 11.616C5.35033 11.7491 5.45465 11.8655 5.57846 11.9583L8.72126 14.3154C8.95775 14.4925 9.25211 14.5743 9.54605 14.5446C9.83999 14.5149 10.1121 14.3759 10.3084 14.1552L16.594 7.08386Z"
      fill={color}
    />
  </Svg>
);

const AdminSvgIcon = ({ color = '#1D3B6D', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size * (23 / 22)} viewBox="0 0 22 23" fill="none">
    <Path
      d="M7.50173 0.00393673C7.80078 -0.0106351 8.0329 0.0122587 8.31395 0.123267C8.80576 0.317544 9.29485 0.532419 9.78118 0.740121L12.278 1.80115L13.8299 2.45681C14.3629 2.68189 15.0072 2.86781 15.26 3.43709C15.3229 3.58047 15.362 3.73315 15.3758 3.88913C15.4388 4.64101 15.3912 5.61463 15.3912 6.38659C15.3912 7.27103 15.4358 8.30057 15.3814 9.17027C15.371 9.33594 15.3468 9.51698 15.2854 9.67219C15.1499 10.0151 14.6373 10.1675 14.3272 10.3046C12.543 11.0933 11.4281 13.1436 11.5974 15.0644C11.6158 15.2728 11.643 15.4857 11.6915 15.6895C11.7776 16.0516 12.0098 16.4708 11.8618 16.8403C11.5363 17.6526 8.96284 19.1957 8.11448 19.5504C7.67334 19.7878 7.0862 19.4851 6.6957 19.2717C6.14623 18.9714 5.60387 18.6443 5.09165 18.2838C2.52012 16.4849 0.763302 13.743 0.203619 10.655C-0.140828 8.65609 0.071373 6.60815 0.00524974 4.5927C-0.0430315 3.12136 0.296814 2.98636 1.55095 2.45529L3.07728 1.80892L5.79448 0.655179C6.197 0.484678 7.117 0.0635994 7.50173 0.00393673Z"
      fill={color}
    />
    <Path
      d="M16.0302 18.5432C16.1662 18.5377 16.3023 18.5339 16.4384 18.5317C17.8972 18.5162 20.1926 18.9427 21.3501 19.9245C21.996 20.4724 22.2744 21.9948 21.6481 22.6352C21.2363 23.0563 20.3361 22.9322 19.7564 22.9312L17.0498 22.9291L13.5532 22.9299C13.1239 22.9307 12.2377 22.9773 11.8622 22.9087C10.6579 22.6834 10.8971 20.7345 11.5023 20.0776C12.5096 18.9844 14.6365 18.6708 16.0302 18.5432Z"
      fill={color}
    />
    <Path
      d="M16.2405 11.9581C17.7492 11.8131 19.0904 12.9171 19.2379 14.4255C19.3854 15.9339 18.2836 17.2769 16.7754 17.4269C15.2637 17.5772 13.917 16.4722 13.7691 14.9603C13.6213 13.4485 14.7284 12.1035 16.2405 11.9581Z"
      fill={color}
    />
  </Svg>
);

export const SettingsScreen: React.FC = () => {
  const { currentUser, language, setLanguage, isRtl, triggerToast } = useApp();
  const { goBack, navigate } = useNavigation();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();

  // Modals state
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Form states
  const [feedbackText, setFeedbackText] = useState('');

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdmin = currentUser?.role === 'admin' || isSuperAdmin;

  const handleFeedbackSubmit = () => {
    if (!feedbackText.trim()) {
      triggerToast('Please enter your feedback');
      return;
    }
    triggerToast('Thank you for your valuable feedback!');
    setFeedbackText('');
    setFeedbackModalVisible(false);
  };

  const confirmLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      setLogoutModalVisible(false);
    } catch (err: any) {
      triggerToast(err?.message || 'Logout failed');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/background_image_vertical.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Top Header Section with Floating Pill ── */}
      <View style={[styles.headerWrapper, { paddingTop: Math.max(insets.top - 20, 16) }]}>
        <View style={styles.pillContainer}>
          <TouchableOpacity
            style={styles.pillActionBtn}
            activeOpacity={0.7}
            onPress={goBack}
            accessibilityLabel="Go Back"
          >
            <BackArrowIcon size={14} color="#1D3B6D" />
          </TouchableOpacity>

          <Text style={styles.pillTitle}>{isRtl ? 'ترتیبات' : 'Settings'}</Text>

          <View style={styles.pillActionPlaceholder} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Language Selector (ENG / URDU) ── */}
        <View style={[styles.langToggleContainer, isRtl && styles.langToggleRtl]}>
          <View style={styles.langPillWrapper}>
            <TouchableOpacity
              style={[
                styles.langTab,
                language === 'en' && styles.langTabActive,
              ]}
              onPress={() => setLanguage('en')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.langTabText,
                  language === 'en' ? styles.langTabTextActive : styles.langTabTextInactive,
                ]}
              >
                EN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langTab,
                language === 'ur' && styles.langTabActive,
              ]}
              onPress={() => setLanguage('ur')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.langTabText,
                  language === 'ur' ? styles.langTabTextActive : styles.langTabTextInactive,
                ]}
              >
                UR
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── User Information Card ── */}
        <View style={[styles.userCard]}>
          <View style={[styles.userInfo]}>
            <Text style={styles.userName} numberOfLines={1}>
              {currentUser?.name || 'User Name'}
            </Text>
            {currentUser?.phone ? (
              <Text style={styles.userPhone} numberOfLines={1}>
                {currentUser.phone}
              </Text>
            ) : null}
            <Text style={styles.userEmail} numberOfLines={1}>
              {currentUser?.email || 'Example123@gmail.com'}
            </Text>

            {/* Logout text button */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => setLogoutModalVisible(true)}
              activeOpacity={0.7}
              accessibilityLabel="Logout"
            >
              <Text style={styles.logoutTextButton}>Log out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Section: GENERAL ── */}
        <Text style={[styles.sectionHeader, isRtl && styles.textRtl]}>
          {isRtl ? 'عام' : 'GENERAL'}
        </Text>

        <View style={styles.groupCard}>
          {/* Edit Profile */}
          <TouchableOpacity
            style={[styles.tileRow, isRtl && styles.rowReverse]}
            onPress={() => navigate('EditProfile')}
            activeOpacity={0.7}
          >
            <View style={[styles.tileLeft, isRtl && styles.rowReverse]}>
              <View style={styles.iconBox}>
                <ProfileSvgIcon size={19} color="#1D3B6D" />
              </View>
              <Text style={styles.tileLabel}>{isRtl ? 'پروفائل میں ترمیم کریں' : 'Edit Profile'}</Text>
            </View>
            <NextArrowIcon size={14} color="#1D3B6D" isRtl={isRtl} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Change Password */}
          <TouchableOpacity
            style={[styles.tileRow, isRtl && styles.rowReverse]}
            onPress={() => navigate('ChangePassword')}
            activeOpacity={0.7}
          >
            <View style={[styles.tileLeft, isRtl && styles.rowReverse]}>
              <View style={styles.iconBox}>
                <SecureSvgIcon size={19} color="#1D3B6D" />
              </View>
              <Text style={styles.tileLabel}>{isRtl ? 'پاس ورڈ تبدیل کریں' : 'Change Password'}</Text>
            </View>
            <NextArrowIcon size={14} color="#1D3B6D" isRtl={isRtl} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Send Feedback */}
          <TouchableOpacity
            style={[styles.tileRow, isRtl && styles.rowReverse]}
            onPress={() => setFeedbackModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.tileLeft, isRtl && styles.rowReverse]}>
              <View style={styles.iconBox}>
                <FeedbackSvgIcon size={19} color="#1D3B6D" />
              </View>
              <Text style={styles.tileLabel}>{isRtl ? 'رائے بھیجیں' : 'Send Feedback'}</Text>
            </View>
            <NextArrowIcon size={14} color="#1D3B6D" isRtl={isRtl} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Privacy Policy */}
          <TouchableOpacity
            style={[styles.tileRow, isRtl && styles.rowReverse]}
            onPress={() => setPrivacyModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.tileLeft, isRtl && styles.rowReverse]}>
              <View style={styles.iconBox}>
                <PrivacyPolicySvgIcon size={19} color="#1D3B6D" />
              </View>
              <Text style={styles.tileLabel}>{isRtl ? 'رازداری کی پالیسی' : 'Privacy Policy'}</Text>
            </View>
            <NextArrowIcon size={14} color="#1D3B6D" isRtl={isRtl} />
          </TouchableOpacity>
        </View>

        {/* ── Section: ADMINISTRATION ── */}
        <Text style={[styles.sectionHeader, isRtl && styles.textRtl]}>
          {isRtl ? 'انتظامیہ' : 'ADMINISTRATION'}
        </Text>

        <View style={styles.groupCard}>
          <TouchableOpacity
            style={[styles.tileRow, isRtl && styles.rowReverse]}
            onPress={() => {
              if (isSuperAdmin) {
                navigate('SuperAdminPanel');
              } else if (isAdmin) {
                navigate('AdminPanel');
              } else {
                navigate('SuperAdminPanel'); // Defaults for demo
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.tileLeft, isRtl && styles.rowReverse]}>
              <View style={styles.iconBox}>
                <AdminSvgIcon size={20} color="#1D3B6D" />
              </View>
              <Text style={styles.tileLabel}>
                {isSuperAdmin
                  ? isRtl
                    ? 'سپر ایڈمن پینل'
                    : 'Super Admin Panel'
                  : isRtl
                    ? 'ایڈمن پینل'
                    : 'Super Admin Panel'}
              </Text>
            </View>
            <NextArrowIcon size={14} color="#1D3B6D" isRtl={isRtl} />
          </TouchableOpacity>
        </View>
      </ScrollView>





      {/* ── Feedback Modal ── */}
      <Modal visible={feedbackModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Feedback</Text>
              <TouchableOpacity onPress={() => setFeedbackModalVisible(false)}>
                <X size={20} color="#1D3B6D" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.modalInput, styles.textAreaInput]}
              placeholder="Tell us what you think or report an issue…"
              placeholderTextColor="#8C9199"
              multiline
              numberOfLines={4}
              value={feedbackText}
              onChangeText={setFeedbackText}
            />
            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleFeedbackSubmit}>
              <Text style={styles.modalSubmitText}>Submit Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Privacy Policy Modal ── */}
      <Modal visible={privacyModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy Policy</Text>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                <X size={20} color="#1D3B6D" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.policyText}>
                Your privacy is important to us. Masjid Locator collects location data exclusively
                to calculate accurate prayer times, Qibla compass direction, and nearby mosques.
                We do not sell or share personal information with third parties.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalSubmitBtn, { marginTop: 16 }]}
              onPress={() => setPrivacyModalVisible(false)}
            >
              <Text style={styles.modalSubmitText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Logout Confirmation Modal ── */}
      <Modal visible={logoutModalVisible} transparent animationType="fade" onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {loggingOut ? (
              <View style={styles.modalLoadingWrapper}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.modalLoadingText, { color: '#1D3B6D' }]}>
                  {isRtl ? 'لاگ آؤٹ ہو رہا ہے...' : 'Logging out...'}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {isRtl ? 'لاگ آؤٹ کی تصدیق' : 'Confirm Logout'}
                  </Text>
                  <TouchableOpacity onPress={() => setLogoutModalVisible(false)} accessibilityLabel="Close">
                    <X size={20} color="#1D3B6D" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalSubText}>
                  {isRtl
                    ? 'کیا آپ واقعی اپنے اکاؤنٹ سے لاگ آؤٹ کرنا چاہتے ہیں؟'
                    : 'Are you sure you want to log out of your account?'}
                </Text>
                <View style={[styles.modalActionsRow, isRtl && styles.rowReverse]}>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, styles.modalCancelBtn]}
                    onPress={() => setLogoutModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelBtnText}>
                      {isRtl ? 'منسوخ کریں' : 'Cancel'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, styles.modalDangerBtn]}
                    onPress={confirmLogout}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalDangerBtnText}>
                      {isRtl ? 'لاگ آؤٹ' : 'Log Out'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  // ── Header Section ──────────────────────────────────────────────────────────
  headerWrapper: {
    paddingBottom: 8,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 50,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  pillActionBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActionPlaceholder: {
    width: 32,
    height: 32,
  },
  pillTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D3B6D',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // ── Scroll Content ──────────────────────────────────────────────────────────
  scrollContent: {
    paddingBottom: 40,
  },

  // ── Language Toggle (ENG / URDU) ────────────────────────────────────────────
  langToggleContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 12,
  },
  langToggleRtl: {
    alignItems: 'flex-start',
  },
  langPillWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 70, 90, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 22,
    padding: 3,
  },
  langTab: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langTabActive: {
    backgroundColor: '#FFFFFF',
  },
  langTabText: {
    fontSize: 10,
    // letterSpacing: 0.3,
  },
  langTabTextActive: {
    color: '#1D3B6D',
    fontWeight: 'bold',
  },
  langTabTextInactive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // ── User Information Card ───────────────────────────────────────────────────
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
    }),
  },
  userInfo: {
    flex: 1,
    // paddingRight: 10,
  },

  logoutButton: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e65b5bff',
    borderRadius: 10,
    // marginRight: 20,
    marginTop: 10
  },

  logoutTextButton: {
    // marginTop: 10,
    color: '#ffffffff',
    fontSize: 13,
    fontWeight: '600',
  },

  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D3B6D',
    letterSpacing: -0.2,
  },
  userPhone: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8C9199',
    marginTop: 4,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8C9199',
    marginTop: 2,
  },

  // ── Section Headers ─────────────────────────────────────────────────────────
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  textRtl: {
    textAlign: 'right',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },

  // ── Group Cards ─────────────────────────────────────────────────────────────
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
    }),
  },
  tileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  tileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D3B6D',
    letterSpacing: -0.2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },

  // ── Modals ──────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1D3B6D',
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1D3B6D',
    marginBottom: 12,
  },
  textAreaInput: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  modalSubmitBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  policyText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
  },
  modalSubText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 21,
    marginBottom: 20,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  modalActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  modalCancelBtnText: {
    color: '#1D3B6D',
    fontSize: 15,
    fontWeight: '700',
  },
  modalDangerBtn: {
    backgroundColor: colors.danger || '#E44848',
  },
  modalDangerBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalLoadingWrapper: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SettingsScreen;
