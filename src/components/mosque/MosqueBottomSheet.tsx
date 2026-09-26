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
  <Svg width={30} height={30} viewBox="0 0 30 30" fill="none">
    <Path d="M20.0487 15.0094C20.7996 14.9635 20.6488 15.9143 20.6306 16.452C20.6092 17.0814 20.7406 18.6351 20.485 19.1044C20.2736 19.3042 19.2462 19.2361 18.9263 19.2305C18.737 19.2233 18.5972 19.2212 18.4515 19.0884C18.274 18.9349 18.1896 18.6353 18.3877 18.4607C18.6817 18.2015 19.3013 18.2805 19.6841 18.2802C19.6934 17.7511 19.6129 15.564 19.757 15.2223C19.8084 15.1002 19.9356 15.0568 20.0487 15.0094Z" fill="#1D3B6D" />
    <Path d="M17.6841 21.4558L20.4467 21.4631C20.9514 21.4633 21.459 21.4764 21.9634 21.4488C22.703 21.4085 22.9759 20.9394 22.9787 20.2449C22.9831 19.1662 22.9757 18.0843 22.9807 17.005C22.9821 16.5237 22.9991 16.0068 22.9459 15.5283C22.7761 13.8628 21.5721 12.4866 19.944 12.0971C19.5761 12.0122 18.8112 11.9994 18.5575 11.7965C18.3127 11.2507 18.5823 10.9623 19.1512 10.9771C21.5777 11.0404 23.6701 12.9464 23.9351 15.3634C24.0032 15.9841 23.9803 16.6121 23.9804 17.2357L23.9789 19.8541C23.9816 20.1127 23.9931 20.3814 23.9606 20.6378C23.7585 22.2319 22.3798 22.6345 20.9858 22.4612C20.9469 24.7867 21.0176 27.124 20.9702 29.4493C20.9633 29.7855 20.7164 29.9461 20.4055 29.958C19.8528 29.9793 19.2983 29.9659 18.745 29.9633L15.8024 29.9643L11.8568 29.964C11.1087 29.9659 10.3535 29.9819 9.61129 29.9576C9.21615 29.9447 9.01908 29.8395 9.00141 29.4362C8.98574 29.0778 8.9908 28.7077 8.99139 28.3507L8.99745 26.36C9.00023 25.5875 8.98259 24.7846 8.99782 24.01C9.0061 23.9165 9.03491 23.6833 9.11741 23.6195C9.51855 23.3092 9.96769 23.4801 9.98326 24.0017C10.0008 24.5908 9.99759 25.1272 9.99734 25.6937L9.99244 28.946C13.2812 28.9841 16.6841 28.9657 19.9765 28.9501L19.9874 22.4805C17.1786 22.4449 14.3055 22.4728 11.494 22.4734L9.24659 22.4738C8.68301 22.4738 7.7025 22.526 7.19904 22.3018C6.56797 22.0207 6.03417 21.3458 6.0122 20.6356C5.92707 19.3266 6.07316 17.9293 5.99628 16.6291C5.82243 13.6892 7.56196 11.2799 10.6453 10.9848C10.9953 10.9679 11.3655 10.9519 11.4807 11.3601C11.6629 12.0055 10.6884 12.005 10.2863 12.0551C9.48889 12.1544 8.75493 12.5637 8.1832 13.1175C7.35019 13.9204 6.98487 14.9772 6.99788 16.1185C6.99923 17.113 6.98911 18.1259 6.99507 19.1192C6.99717 19.4662 6.9702 20.3816 7.02601 20.6767C7.06107 20.8646 7.15253 21.0373 7.28823 21.1719C7.65493 21.5373 8.33054 21.4527 8.81277 21.4628C9.179 21.4705 9.55675 21.4628 9.92405 21.4627L13.9818 21.4568L13.9931 19.4845C13.0208 19.4767 12.0485 19.4746 11.0761 19.4782C10.5809 19.4785 10.0839 19.4905 9.58944 19.4671C9.27219 19.4454 9.03254 19.3832 9.00504 19.0219C8.99576 18.7712 8.98253 18.6086 8.99193 18.3496C9.02835 17.3482 8.91001 16.1947 9.06001 15.2167C9.10771 14.9055 9.94571 14.8502 9.97671 15.3947C9.99207 15.665 9.99388 16.0756 9.99431 16.3993L9.99197 18.4578C11.7495 18.4787 13.5105 18.4526 15.2683 18.4623C15.916 18.4659 16.4809 18.4195 17.0532 18.781C17.5082 19.0701 17.8277 19.5302 17.9397 20.0576C18.0449 20.5391 17.9528 21.0427 17.6841 21.4558ZM14.9863 21.455C15.586 21.4642 16.1786 21.547 16.6632 21.1614C16.8506 20.9595 17.0181 20.6941 16.9873 20.416C16.8514 19.1884 15.6708 19.5716 14.9996 19.462C14.9658 20.0716 14.9918 20.8299 14.9863 21.455Z" fill="#1D3B6D" />
    <Path d="M5.76283 0.00619037C7.4212 -0.0964273 8.84426 1.08755 8.979 2.7561C9.01149 3.15863 8.98324 3.56545 8.99826 3.95615C9.04789 5.24629 8.81299 5.75883 8.01644 6.73001C7.99118 6.91437 7.99587 7.27995 7.99315 7.47929C9.20129 7.47783 9.96646 7.60812 10.9138 8.45827C11.1916 8.74471 11.5271 9.0526 11.5699 9.46903C11.5986 9.74832 11.255 10.0238 11.0297 9.98313C10.7931 9.94043 10.4492 9.43538 10.2652 9.24049C9.54944 8.48243 8.90208 8.52476 7.93225 8.49277C7.9099 8.55907 7.88483 8.62441 7.85705 8.68862C7.58475 9.33511 7.15018 9.67168 6.51821 9.92666C6.44928 10.5486 6.80072 12.385 5.71005 11.9124C5.36017 11.7608 5.53196 10.3511 5.47511 9.98769C5.40887 9.88942 5.16882 9.79799 5.05129 9.72703C4.54081 9.41892 4.24631 9.089 4.08901 8.51356C4.06719 8.51053 4.04531 8.50797 4.02336 8.50597C2.50088 8.36237 1.10132 9.17616 1.02197 10.827C0.956668 12.1857 1.01427 13.5732 1.01425 14.9338C1.01424 15.2604 1.17112 15.4117 1.4853 15.4602C2.46254 15.514 3.38936 15.4549 4.37605 15.4729C4.88812 15.4226 5.22788 15.9997 4.83758 16.3375C4.57439 16.5654 3.3425 16.5169 3.00558 16.4768C3.00034 16.854 3.0029 17.2378 3.00181 17.6155L2.99981 23.4614L6.14477 23.468C6.57346 23.4684 7.12843 23.4518 7.54885 23.4849C8.14939 23.5323 8.16172 24.4546 7.4345 24.4671C5.90328 24.4935 4.36908 24.4768 2.83714 24.4808C2.4528 24.4815 2.03056 24.4821 2.01552 23.9964C1.98914 23.1441 2.00079 22.2882 2.00074 21.4348L2.00686 16.5042C1.42614 16.4934 0.88526 16.4796 0.4394 16.0395C0.0989163 15.719 -0.00226851 15.2668 3.83805e-05 14.8121C0.00550437 13.7335 0.00789553 12.6496 0.00261684 11.5703C0.000110167 11.0578 0.0019613 10.5396 0.135664 10.0402C0.293688 9.46241 0.598126 8.93523 1.01953 8.50953C1.90729 7.61062 2.81619 7.49209 3.9978 7.48101L3.99318 6.79934C3.9324 6.66551 3.75166 6.4451 3.64964 6.32791C2.96828 5.54516 3.00337 4.73022 2.99762 3.75318C2.99179 2.75535 2.99697 1.92724 3.6654 1.10307C4.23389 0.402136 4.88153 0.110843 5.76283 0.00619037ZM8.0037 4.01019C7.11372 4.00091 6.22368 3.99904 5.33367 4.00463C5.02953 4.0055 4.27416 4.0291 4.00797 3.98718C3.9806 4.71246 4.00835 5.2884 4.53743 5.85626C4.89795 6.24147 5.3981 6.46573 5.92553 6.47872C6.47519 6.49492 7.00815 6.28851 7.40354 5.9063C7.41696 5.89356 7.43023 5.8807 7.44337 5.86765C7.97904 5.19251 7.9871 4.8627 8.0037 4.01019ZM3.98469 2.98626L6.32392 2.98963C6.88091 2.98972 7.44714 2.99547 8.00323 2.98969C7.96259 2.71889 7.93746 2.48367 7.83407 2.22951C7.47334 1.34258 6.65319 0.923621 5.72363 1.03325C4.6028 1.18106 4.12101 1.93407 3.98469 2.98626ZM6.77387 8.59996C7.04336 8.21322 7.00312 7.79243 6.99726 7.33145C6.27044 7.52328 5.77317 7.55243 5.04564 7.33414L5.02198 7.32693C4.96429 7.74801 4.95308 8.25387 5.22516 8.60461C5.38458 8.81167 5.62042 8.94609 5.87983 8.97781C6.25012 9.02073 6.52789 8.85856 6.77387 8.59996Z" fill="#1D3B6D" />
    <Path d="M23.7423 0.00538411C25.4023 -0.0888551 26.8204 1.06301 26.9632 2.75418C27.0048 3.24668 26.9687 3.74033 26.9813 4.22409C27.0112 5.36334 26.6912 5.88818 26.0008 6.72737C25.9753 6.91236 25.9804 7.27899 25.978 7.47909C27.2727 7.46055 28.2385 7.70853 29.133 8.7087C30.2272 9.9322 29.9426 11.4186 29.9745 12.9219C29.9543 13.6151 30.0166 14.3232 29.9693 15.0149C29.8917 16.1499 28.9759 16.5776 27.983 16.4818C27.9371 18.9691 28.0197 21.473 27.9678 23.9602C27.9312 24.3602 27.6977 24.4695 27.344 24.4728C25.7524 24.4873 24.162 24.4784 22.5714 24.4735C21.7626 24.471 21.8347 23.5258 22.4473 23.4845C22.93 23.4519 23.4891 23.4645 23.9775 23.4649L26.9736 23.4647C26.9951 21.7023 26.9795 19.9105 26.9797 18.1459C26.9767 17.5956 26.9784 17.0453 26.9847 16.495C26.4119 16.4842 25.8091 16.5554 25.2634 16.4184C24.8418 16.3125 24.9353 15.6246 25.2231 15.5453C26.1549 15.2886 27.9667 15.6919 28.8196 15.3649C28.9343 15.1446 28.9786 14.9941 28.9797 14.743C28.9845 13.7237 28.9704 12.7043 28.9794 11.6849C28.9833 11.2374 28.9902 10.7801 28.8821 10.343C28.785 9.94684 28.5894 9.58167 28.3133 9.28137C27.5809 8.48313 26.8759 8.52974 25.9162 8.49134C25.8938 8.5574 25.8687 8.62255 25.841 8.6866C25.5689 9.33353 25.1364 9.66945 24.5044 9.92533C24.4477 10.4442 24.6775 11.7687 24.1481 11.9484C23.1215 12.2971 23.6182 10.4852 23.4567 9.99778C23.4204 9.8884 23.131 9.79631 23.0371 9.7262C22.5373 9.42537 22.2357 9.10403 22.0736 8.5146C19.8522 8.21058 19.4287 9.94284 18.9021 9.98327C18.7819 9.99248 18.5725 9.88725 18.485 9.80655C18.4146 9.7415 18.3763 9.655 18.375 9.5591C18.3704 9.20124 18.7514 8.76611 18.9904 8.52259C19.8747 7.62156 20.7804 7.49389 21.9824 7.48062C21.9943 6.83544 21.9987 6.73829 21.5679 6.24046C20.8419 5.37667 20.9924 4.22762 20.9829 3.18268C20.9668 1.43617 22.0261 0.212748 23.7423 0.00538411ZM25.425 5.86895C25.9613 5.19599 25.9718 4.8606 25.9882 4.00929C25.1178 4.00068 24.2474 3.99896 23.377 4.00411C23.0677 4.00514 22.2615 4.02902 21.9919 3.98679C21.9663 4.71282 21.9912 5.28942 22.5238 5.85699C22.8885 6.24501 23.9272 6.47786 23.9272 6.47786ZM21.9695 2.98621L24.3089 2.9893C24.8658 2.98939 25.4321 2.99514 25.9881 2.98936C25.9462 2.71363 25.9196 2.48846 25.8184 2.22912C25.4825 1.36817 24.6091 0.895538 23.6997 1.03351C22.5855 1.18643 22.1027 1.93308 21.9695 2.98621ZM24.7583 8.59932C25.0267 8.21349 24.9876 7.79082 24.9816 7.33091C24.3146 7.50697 23.6687 7.5644 23.0043 7.32394C22.93 8.01529 22.9764 8.85954 23.8916 8.98253C24.225 9.0273 24.5319 8.83585 24.7583 8.59932Z" fill="#1D3B6D" />
    <Path d="M14.7083 1.50562C15.4749 1.47037 16.1191 1.59688 16.7845 1.99758C17.5743 2.46654 18.1447 3.23084 18.3696 4.12145C18.5187 4.73351 18.5316 6.89028 18.4362 7.53321C18.393 7.82896 18.3076 8.11696 18.1825 8.38839C18.0047 8.77488 17.5446 9.30858 17.5049 9.56802C17.3725 10.4327 17.715 11.3746 17.2061 12.1635C16.8006 12.792 16.2492 13.2625 15.507 13.4419C15.4437 14.1107 15.5373 14.8099 15.4742 15.4802C15.4556 15.6778 15.3951 15.7837 15.2529 15.9172C14.8954 16.0429 14.5211 15.9352 14.4966 15.5086C14.4577 14.8314 14.4881 14.1322 14.4813 13.4499C14.116 13.3428 13.7026 13.1718 13.4077 12.9222C12.4669 12.196 12.4233 11.298 12.488 10.1904C12.5226 9.59774 12.4997 9.44025 12.1115 8.95168C11.423 8.08518 11.4982 7.07442 11.488 6.04172C11.4763 4.85447 11.4456 3.75812 12.2624 2.79035C12.9334 1.97907 13.6734 1.62163 14.7083 1.50562ZM16.775 8.71191C17.5689 7.85874 17.4889 7.10976 17.4884 6.00164C16.354 5.9929 15.2197 5.99128 14.0853 5.99677C13.723 5.99724 12.8032 6.02381 12.4967 5.98248C12.4723 7.02201 12.3975 7.88621 13.1677 8.70657C13.6266 9.19533 14.2536 9.45748 14.9233 9.47322C15.5799 9.49285 16.217 9.24843 16.6921 8.79467C16.7202 8.76754 16.7478 8.73994 16.775 8.71191ZM12.4776 4.98177L15.3436 4.98421L17.4884 4.98564C17.4435 4.59406 17.4106 4.29342 17.2446 3.93278C16.784 2.93167 15.7527 2.37826 14.6654 2.53394C13.2606 2.71009 12.6326 3.65654 12.4776 4.98177ZM16.1844 11.8695C16.6006 11.2734 16.4959 10.8943 16.482 10.1569C15.5709 10.509 14.6107 10.6494 13.6806 10.2345C13.621 10.2076 13.5625 10.1785 13.5051 10.1471C13.4732 10.8527 13.3572 11.4218 13.8537 11.9663C14.1236 12.2668 14.503 12.4462 14.9066 12.4641C15.4581 12.4895 15.8284 12.2589 16.1844 11.8695Z" fill="#1D3B6D" />
    <Path d="M27.3519 11.4864C27.7301 11.4625 27.9705 11.6465 27.9615 12.0391C27.9517 12.4723 28.0884 14.0936 27.7915 14.3601C27.5664 14.5622 25.9719 14.4837 25.5995 14.4805C25.4878 14.4746 25.1905 14.4388 25.1215 14.3422C24.3348 13.2421 26.4053 13.4693 26.9646 13.4716C26.9728 13.0573 26.9499 12.6411 26.9594 12.2275C26.968 11.8533 26.9904 11.6322 27.3519 11.4864Z" fill="#1D3B6D" />
    <Path d="M2.38535 11.4849C2.64289 11.4801 2.69751 11.5074 2.91166 11.6516C3.05953 12.0725 3.00643 12.9756 3.00187 13.4633C3.48985 13.4627 4.15348 13.4231 4.61651 13.5166C5.1372 13.6217 5.10733 14.2223 4.62922 14.4611C4.12413 14.5042 2.75252 14.5645 2.31674 14.4256C2.22324 14.3957 2.13503 14.3559 2.08979 14.263C1.96094 13.9981 1.94571 11.999 2.06909 11.7203C2.12888 11.5853 2.25892 11.5398 2.38535 11.4849Z" fill="#1D3B6D" />
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
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetScrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
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
        </ScrollView>
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
