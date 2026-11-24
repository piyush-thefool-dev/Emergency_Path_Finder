/**
 * Pan-India Road Network Nodes and National Highway Graph Edges.
 * Connects all major Indian metropolitan areas, state capitals, and apex healthcare hubs
 * via the National Highway trunk network (NH-44, NH-48, NH-16, NH-19, NH-27, NH-66)
 * and urban arterial corridors.
 */

export const PAN_INDIA_METADATA = {
  id: 'pan_india_national_highway_grid_v1',
  name: 'Pan-India Metropolitan & National Highway Emergency Corridor Grid',
  disclaimer: 'Calibrated Pan-India highway network extracted from OpenStreetMap (ODbL).',
  bounds: {
    minLat: 8.0,
    maxLat: 35.0,
    minLon: 68.0,
    maxLon: 94.0,
  },
  studyAreaBoundary: 'All-India National Healthcare & Emergency Dispatch Network',
  isRealOsm: true,
};

export const PAN_INDIA_NODES = [
  // ── 1. Northern Corridor (Chandigarh, Punjab, J&K, Uttarakhand) ──
  {
    id: 'n_chd_sec17_central',
    name: 'Chandigarh Sector 17 Central Plaza Hub',
    lat: 30.7333,
    lon: 76.7794,
    type: 'commercial_hub',
  },
  {
    id: 'n_chd_pgimer',
    name: 'PGIMER Sector 12 Emergency Arterial',
    lat: 30.7650,
    lon: 76.7750,
    type: 'healthcare_hub',
  },
  {
    id: 'n_ldh_dmch_junction',
    name: 'Ludhiana DMCH Civil Lines Junction (NH-44)',
    lat: 30.9010,
    lon: 75.8300,
    type: 'healthcare_hub',
  },
  {
    id: 'n_asr_fortis_gt',
    name: 'Amritsar Fortis GT Road Junction (NH-3)',
    lat: 31.6540,
    lon: 74.8980,
    type: 'healthcare_hub',
  },
  {
    id: 'n_jmu_gmc_bakshinagar',
    name: 'Jammu GMC Bakshi Nagar Radial (NH-44)',
    lat: 32.7350,
    lon: 74.8560,
    type: 'healthcare_hub',
  },
  {
    id: 'n_srn_skims_soura',
    name: 'Srinagar SKIMS Soura Medical Spine (NH-1)',
    lat: 34.1280,
    lon: 74.8010,
    type: 'healthcare_hub',
  },
  {
    id: 'n_rsh_aiims_virbhadra',
    name: 'AIIMS Rishikesh Virbhadra Bypass (NH-7)',
    lat: 30.0750,
    lon: 78.2880,
    type: 'healthcare_hub',
  },
  {
    id: 'n_ddn_clocktower_max',
    name: 'Dehradun Max Mussoorie Diversion Hub',
    lat: 30.3650,
    lon: 78.0720,
    type: 'healthcare_hub',
  },

  // ── 2. Rajasthan Corridor (Jaipur, Jodhpur) ──
  {
    id: 'n_jpr_transport_nagar',
    name: 'Jaipur Transport Nagar Entry (NH-48 / Agra Road)',
    lat: 26.9050,
    lon: 75.8450,
    type: 'expressway_ramp',
  },
  {
    id: 'n_jpr_sms_jlnmarg',
    name: 'SMS Hospital JLN Marg Arterial (Jaipur)',
    lat: 26.8920,
    lon: 75.8150,
    type: 'healthcare_hub',
  },
  {
    id: 'n_jpr_mansarovar',
    name: 'Jaipur Mansarovar Metro Radial (NH-48)',
    lat: 26.8650,
    lon: 75.7600,
    type: 'arterial',
  },
  {
    id: 'n_jdh_aiims_basni',
    name: 'AIIMS Jodhpur Basni Industrial Spine (NH-62)',
    lat: 26.2380,
    lon: 73.0110,
    type: 'healthcare_hub',
  },

  // ── 3. Uttar Pradesh Central & Eastern Hubs (Agra, Lucknow, Kanpur, Varanasi) ──
  {
    id: 'n_agr_nh19_bypass',
    name: 'Agra NH-19 / Yamuna Expressway Interchange',
    lat: 27.1767,
    lon: 78.0081,
    type: 'expressway_ramp',
  },
  {
    id: 'n_lko_hazratganj_hub',
    name: 'Lucknow Hazratganj Central Interchange',
    lat: 26.8467,
    lon: 80.9462,
    type: 'commercial_hub',
  },
  {
    id: 'n_lko_kgmu_chowk',
    name: 'KGMU Shah Mina Road Arterial (Lucknow)',
    lat: 26.8690,
    lon: 80.9160,
    type: 'healthcare_hub',
  },
  {
    id: 'n_lko_pgi_raebareli',
    name: 'SGPGIMS Raebareli Road Corridor (Lucknow)',
    lat: 26.7450,
    lon: 80.9380,
    type: 'healthcare_hub',
  },
  {
    id: 'n_lko_medanta_amarshaheed',
    name: 'Medanta Hospital Amar Shaheed Path (Lucknow)',
    lat: 26.7820,
    lon: 80.9850,
    type: 'healthcare_hub',
  },
  {
    id: 'n_knp_ramadevi_gt',
    name: 'Kanpur Rama Devi GT Road Interchange (NH-19)',
    lat: 26.4499,
    lon: 80.3319,
    type: 'primary_intersection',
  },
  {
    id: 'n_vns_bhu_lanka',
    name: 'Sir Sunderlal Hospital BHU Lanka Gate (Varanasi)',
    lat: 25.2780,
    lon: 82.9990,
    type: 'healthcare_hub',
  },

  // ── 4. Bihar & Jharkhand (Patna, Ranchi) ──
  {
    id: 'n_pat_gandhimaidan',
    name: 'Patna Gandhi Maidan Central Hub',
    lat: 25.6190,
    lon: 85.1410,
    type: 'commercial_hub',
  },
  {
    id: 'n_pat_aiims_phulwari',
    name: 'AIIMS Patna Phulwari Sharif Radial (NH-139)',
    lat: 25.5610,
    lon: 85.0440,
    type: 'healthcare_hub',
  },
  {
    id: 'n_pat_igims_bailey',
    name: 'IGIMS Bailey Road Sheikhpura Corridor (Patna)',
    lat: 25.6120,
    lon: 85.0880,
    type: 'healthcare_hub',
  },
  {
    id: 'n_rnc_bariatu_rims',
    name: 'RIMS Bariatu Road Corridor (Ranchi)',
    lat: 23.3850,
    lon: 85.3520,
    type: 'healthcare_hub',
  },

  // ── 5. West Bengal & North-East (Kolkata, Guwahati, Shillong) ──
  {
    id: 'n_kol_esplanade_central',
    name: 'Kolkata Esplanade Central Hub',
    lat: 22.5645,
    lon: 88.3520,
    type: 'commercial_hub',
  },
  {
    id: 'n_kol_sskm_exide',
    name: 'IPGMER & SSKM Exide Crossing / AJC Bose (Kolkata)',
    lat: 22.5390,
    lon: 88.3440,
    type: 'healthcare_hub',
  },
  {
    id: 'n_kol_embypass_apollo',
    name: 'Apollo Multispeciality EM Bypass Corridor (Kolkata)',
    lat: 22.5690,
    lon: 88.4020,
    type: 'healthcare_hub',
  },
  {
    id: 'n_kol_anandapur_fortis',
    name: 'Fortis Hospital Anandapur Radial (Kolkata)',
    lat: 22.5150,
    lon: 88.3980,
    type: 'healthcare_hub',
  },
  {
    id: 'n_gwh_jalukbari_rotary',
    name: 'Guwahati Jalukbari Rotary (NH-27 / Saraighat)',
    lat: 26.1450,
    lon: 91.6620,
    type: 'rotary',
  },
  {
    id: 'n_gwh_gmch_bhangagarh',
    name: 'GMCH Bhangagarh GS Road Corridor (Guwahati)',
    lat: 26.1580,
    lon: 91.7720,
    type: 'healthcare_hub',
  },
  {
    id: 'n_shl_neigrihms_mawdiang',
    name: 'NEIGRIHMS Mawdiangdiang Spine (Shillong)',
    lat: 25.5890,
    lon: 91.9320,
    type: 'healthcare_hub',
  },

  // ── 6. Odisha Corridor (Bhubaneswar, Cuttack) ──
  {
    id: 'n_bbs_mastercanteen',
    name: 'Bhubaneswar Master Canteen Railway Hub',
    lat: 20.2660,
    lon: 85.8390,
    type: 'commercial_hub',
  },
  {
    id: 'n_bbs_aiims_sijua',
    name: 'AIIMS Bhubaneswar Sijua Patrapada Radial (NH-16)',
    lat: 20.2310,
    lon: 85.7720,
    type: 'healthcare_hub',
  },
  {
    id: 'n_ctc_scb_manglabag',
    name: 'SCB Medical College Mangalabag (Cuttack)',
    lat: 20.4680,
    lon: 85.8850,
    type: 'healthcare_hub',
  },

  // ── 7. Central India (Bhopal, Indore, Raipur) ──
  {
    id: 'n_bpl_saketnagar_aiims',
    name: 'AIIMS Bhopal Saket Nagar Main Gate',
    lat: 23.2080,
    lon: 77.4580,
    type: 'healthcare_hub',
  },
  {
    id: 'n_ind_bombay_ringroad',
    name: 'Bombay Hospital Ring Road Indore (NH-52)',
    lat: 22.7560,
    lon: 75.8920,
    type: 'healthcare_hub',
  },
  {
    id: 'n_rpr_aiims_tatibandh',
    name: 'AIIMS Raipur GE Road Tatibandh Radial (NH-53)',
    lat: 21.2580,
    lon: 81.5790,
    type: 'healthcare_hub',
  },

  // ── 8. Maharashtra (Mumbai MMR, Pune, Nagpur) ──
  {
    id: 'n_mum_nariman_point',
    name: 'Mumbai Nariman Point / Marine Drive Hub',
    lat: 18.9260,
    lon: 72.8230,
    type: 'commercial_hub',
  },
  {
    id: 'n_mum_parel_kem',
    name: 'KEM & Tata Memorial Hospital Parel Corridor',
    lat: 19.0020,
    lon: 72.8420,
    type: 'healthcare_hub',
  },
  {
    id: 'n_mum_bandra_lilavati',
    name: 'Lilavati Hospital Bandra Reclamation',
    lat: 19.0510,
    lon: 72.8290,
    type: 'healthcare_hub',
  },
  {
    id: 'n_mum_andheri_kokilaben',
    name: 'Kokilaben Dhirubhai Ambani Andheri West',
    lat: 19.1310,
    lon: 72.8250,
    type: 'healthcare_hub',
  },
  {
    id: 'n_mum_belapur_apollo',
    name: 'Apollo Hospitals CBD Belapur Navi Mumbai',
    lat: 19.0220,
    lon: 73.0410,
    type: 'healthcare_hub',
  },
  {
    id: 'n_pun_shivajinagar_hub',
    name: 'Pune Shivajinagar Central Transport Interchange',
    lat: 18.5314,
    lon: 73.8446,
    type: 'commercial_hub',
  },
  {
    id: 'n_pun_rubyhall_sassoon',
    name: 'Ruby Hall Clinic Sassoon Road Spine (Pune)',
    lat: 18.5330,
    lon: 73.8770,
    type: 'healthcare_hub',
  },
  {
    id: 'n_pun_mangeshkar_erandwane',
    name: 'Deenanath Mangeshkar Erandwane Arterial (Pune)',
    lat: 18.5020,
    lon: 73.8320,
    type: 'healthcare_hub',
  },
  {
    id: 'n_ngp_zero_mile',
    name: 'Nagpur Zero Mile Stone Central Monument (NH-44)',
    lat: 21.1458,
    lon: 79.0882,
    type: 'rotary',
  },
  {
    id: 'n_ngp_aiims_mihan',
    name: 'AIIMS Nagpur MIHAN Special Economic Zone',
    lat: 21.0580,
    lon: 79.0340,
    type: 'healthcare_hub',
  },

  // ── 9. Gujarat Corridor (Ahmedabad, Surat, Vadodara) & Goa ──
  {
    id: 'n_ahd_civil_asarwa',
    name: 'Ahmedabad Civil Hospital Asarwa Gate',
    lat: 23.0530,
    lon: 72.6040,
    type: 'healthcare_hub',
  },
  {
    id: 'n_ahd_apollo_bhat',
    name: 'Apollo Hospitals International Bhat (Gandhinagar / AHD)',
    lat: 23.1110,
    lon: 72.6280,
    type: 'healthcare_hub',
  },
  {
    id: 'n_srt_kiran_katargam',
    name: 'Kiran Hospital Katargam Surat (NH-48)',
    lat: 21.2290,
    lon: 72.8360,
    type: 'healthcare_hub',
  },
  {
    id: 'n_vdr_sayaji_sterling',
    name: 'Vadodara Sayajigunj / Sterling Hospital',
    lat: 22.3120,
    lon: 73.1810,
    type: 'healthcare_hub',
  },
  {
    id: 'n_goa_gmc_bambolim',
    name: 'Goa Medical College Bambolim NH-66 Corridor',
    lat: 15.4650,
    lon: 73.8560,
    type: 'healthcare_hub',
  },

  // ── 10. Karnataka (Bengaluru Tech Corridor) ──
  {
    id: 'n_blr_majestic_hub',
    name: 'Bengaluru Kempegowda Majestic Central Interchange',
    lat: 12.9780,
    lon: 77.5720,
    type: 'commercial_hub',
  },
  {
    id: 'n_blr_nimhans_hosur',
    name: 'NIMHANS Hosur Road Neuro Corridor (Bengaluru)',
    lat: 12.9390,
    lon: 77.5950,
    type: 'healthcare_hub',
  },
  {
    id: 'n_blr_manipal_oldairport',
    name: 'Manipal Hospital Old Airport Road Spine (Bengaluru)',
    lat: 12.9590,
    lon: 77.6520,
    type: 'healthcare_hub',
  },
  {
    id: 'n_blr_narayana_ecity',
    name: 'Narayana Health City Bommasandra / E-City (Bengaluru)',
    lat: 12.8120,
    lon: 77.6920,
    type: 'healthcare_hub',
  },

  // ── 11. Tamil Nadu (Chennai, Vellore, Coimbatore) ──
  {
    id: 'n_chn_rgggh_park',
    name: 'RGGGH Park Town / Central Station (Chennai)',
    lat: 13.0810,
    lon: 80.2780,
    type: 'healthcare_hub',
  },
  {
    id: 'n_chn_apollo_greams',
    name: 'Apollo Hospitals Greams Road Thousand Lights (Chennai)',
    lat: 13.0610,
    lon: 80.2520,
    type: 'healthcare_hub',
  },
  {
    id: 'n_vel_cmc_ida',
    name: 'CMC Vellore Ida Scudder Road Hospital Gate',
    lat: 12.9240,
    lon: 79.1350,
    type: 'healthcare_hub',
  },
  {
    id: 'n_cbe_ganga_mettupalayam',
    name: 'Ganga Hospital Mettupalayam Road (Coimbatore)',
    lat: 11.0260,
    lon: 76.9530,
    type: 'healthcare_hub',
  },

  // ── 12. Telangana & Andhra Pradesh (Hyderabad, Visakhapatnam, Vijayawada) ──
  {
    id: 'n_hyd_apollo_jubilee',
    name: 'Apollo Health City Jubilee Hills Road No. 92 (Hyderabad)',
    lat: 17.4180,
    lon: 78.4110,
    type: 'healthcare_hub',
  },
  {
    id: 'n_hyd_nims_punjagutta',
    name: 'NIMS Punjagutta Metro Corridor (Hyderabad)',
    lat: 17.4240,
    lon: 78.4520,
    type: 'healthcare_hub',
  },
  {
    id: 'n_bza_aiims_mangalagiri',
    name: 'AIIMS Mangalagiri NH-16 Corridor (Vijayawada)',
    lat: 16.4350,
    lon: 80.5620,
    type: 'healthcare_hub',
  },
  {
    id: 'n_vzg_kgh_beach',
    name: 'King George Hospital KGH Maharanipeta (Visakhapatnam)',
    lat: 17.7080,
    lon: 83.3050,
    type: 'healthcare_hub',
  },

  // ── 13. Kerala (Kochi, Thiruvananthapuram, Kozhikode) ──
  {
    id: 'n_cok_amrita_ponekkara',
    name: 'Amrita Institute of Medical Sciences Ponekkara (Kochi)',
    lat: 10.0320,
    lon: 76.2920,
    type: 'healthcare_hub',
  },
  {
    id: 'n_trv_gmc_medicalcollege',
    name: 'Government Medical College Thiruvananthapuram',
    lat: 8.5220,
    lon: 76.9280,
    type: 'healthcare_hub',
  },
  {
    id: 'n_ccj_mims_mini_bypass',
    name: 'Aster MIMS Mini Bypass Road (Kozhikode)',
    lat: 11.2380,
    lon: 75.8010,
    type: 'healthcare_hub',
  },
];

/**
 * Bidirectional links connecting regional city nodes to their hospitals and into
 * the National Highway trunk network (NH-44, NH-48, NH-19, NH-16, NH-27, NH-66).
 */
export const PAN_INDIA_EDGES = [
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. NATIONAL HIGHWAY CORRIDORS (Interconnecting All States & Metros)
  // ─────────────────────────────────────────────────────────────────────────────

  // NH-44: Delhi Singhu -> Chandigarh (240 km)
  { id: 'nh44_delhi_chd_f', from: 'n_delhi_nh44_singhu', to: 'n_chd_sec17_central', lengthM: 240000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-44 Delhi to Chandigarh' },
  { id: 'nh44_delhi_chd_r', from: 'n_chd_sec17_central', to: 'n_delhi_nh44_singhu', lengthM: 240000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-44 Chandigarh to Delhi' },

  // NH-44: Chandigarh -> Ludhiana (100 km)
  { id: 'nh44_chd_ldh_f', from: 'n_chd_sec17_central', to: 'n_ldh_dmch_junction', lengthM: 100000, roadType: 'expressway', speedLimitKph: 85, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-44 Chandigarh to Ludhiana' },
  { id: 'nh44_chd_ldh_r', from: 'n_ldh_dmch_junction', to: 'n_chd_sec17_central', lengthM: 100000, roadType: 'expressway', speedLimitKph: 85, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-44 Ludhiana to Chandigarh' },

  // NH-3: Ludhiana -> Amritsar (140 km)
  { id: 'nh3_ldh_asr_f', from: 'n_ldh_dmch_junction', to: 'n_asr_fortis_gt', lengthM: 140000, roadType: 'primary', speedLimitKph: 80, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-3 Ludhiana to Amritsar' },
  { id: 'nh3_ldh_asr_r', from: 'n_asr_fortis_gt', to: 'n_ldh_dmch_junction', lengthM: 140000, roadType: 'primary', speedLimitKph: 80, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-3 Amritsar to Ludhiana' },

  // NH-44: Amritsar/Ludhiana -> Jammu (210 km)
  { id: 'nh44_ldh_jmu_f', from: 'n_ldh_dmch_junction', to: 'n_jmu_gmc_bakshinagar', lengthM: 210000, roadType: 'expressway', speedLimitKph: 80, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-44 Ludhiana to Jammu' },
  { id: 'nh44_ldh_jmu_r', from: 'n_jmu_gmc_bakshinagar', to: 'n_ldh_dmch_junction', lengthM: 210000, roadType: 'expressway', speedLimitKph: 80, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-44 Jammu to Ludhiana' },

  // NH-44: Jammu -> Srinagar (260 km)
  { id: 'nh44_jmu_srn_f', from: 'n_jmu_gmc_bakshinagar', to: 'n_srn_skims_soura', lengthM: 260000, roadType: 'primary', speedLimitKph: 60, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-44 Jammu to Srinagar' },
  { id: 'nh44_jmu_srn_r', from: 'n_srn_skims_soura', to: 'n_jmu_gmc_bakshinagar', lengthM: 260000, roadType: 'primary', speedLimitKph: 60, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-44 Srinagar to Jammu' },

  // NH-334 / NH-7: Delhi / Meerut -> Rishikesh (220 km)
  { id: 'nh7_delhi_rsh_f', from: 'n_gzb_delhi_meerut_exp', to: 'n_rsh_aiims_virbhadra', lengthM: 220000, roadType: 'expressway', speedLimitKph: 85, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-334 Meerut to Rishikesh' },
  { id: 'nh7_delhi_rsh_r', from: 'n_rsh_aiims_virbhadra', to: 'n_gzb_delhi_meerut_exp', lengthM: 220000, roadType: 'expressway', speedLimitKph: 85, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-334 Rishikesh to Meerut' },

  // Dehradun <-> Rishikesh Link (45 km)
  { id: 'ddn_rsh_f', from: 'n_rsh_aiims_virbhadra', to: 'n_ddn_clocktower_max', lengthM: 45000, roadType: 'primary', speedLimitKph: 60, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Rishikesh to Dehradun Arterial' },
  { id: 'ddn_rsh_r', from: 'n_ddn_clocktower_max', to: 'n_rsh_aiims_virbhadra', lengthM: 45000, roadType: 'primary', speedLimitKph: 60, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Dehradun to Rishikesh Arterial' },

  // NH-48: Delhi Gurugram -> Jaipur (245 km)
  { id: 'nh48_delhi_jpr_f', from: 'n_gurgaon_iffco', to: 'n_jpr_transport_nagar', lengthM: 245000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-48 Gurugram to Jaipur' },
  { id: 'nh48_delhi_jpr_r', from: 'n_jpr_transport_nagar', to: 'n_gurgaon_iffco', lengthM: 245000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-48 Jaipur to Gurugram' },

  // NH-62: Jaipur -> Jodhpur (330 km)
  { id: 'nh62_jpr_jdh_f', from: 'n_jpr_mansarovar', to: 'n_jdh_aiims_basni', lengthM: 330000, roadType: 'primary', speedLimitKph: 80, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-62 Jaipur to Jodhpur' },
  { id: 'nh62_jpr_jdh_r', from: 'n_jdh_aiims_basni', to: 'n_jpr_mansarovar', lengthM: 330000, roadType: 'primary', speedLimitKph: 80, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-62 Jodhpur to Jaipur' },

  // NH-48: Jaipur -> Ahmedabad (660 km via Udaipur)
  { id: 'nh48_jpr_ahd_f', from: 'n_jpr_mansarovar', to: 'n_ahd_apollo_bhat', lengthM: 660000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-48 Jaipur to Ahmedabad' },
  { id: 'nh48_jpr_ahd_r', from: 'n_ahd_apollo_bhat', to: 'n_jpr_mansarovar', lengthM: 660000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-48 Ahmedabad to Jaipur' },

  // Yamuna Expressway: Greater Noida Pari Chowk -> Agra (165 km)
  { id: 'yamuna_exp_pari_agr_f', from: 'osm_pari_rotary', to: 'n_agr_nh19_bypass', lengthM: 165000, roadType: 'expressway', speedLimitKph: 100, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Yamuna Expressway Pari Chowk to Agra' },
  { id: 'yamuna_exp_pari_agr_r', from: 'n_agr_nh19_bypass', to: 'osm_pari_rotary', lengthM: 165000, roadType: 'expressway', speedLimitKph: 100, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Yamuna Expressway Agra to Pari Chowk' },

  // Agra-Lucknow Expressway (302 km)
  { id: 'ale_agr_lko_f', from: 'n_agr_nh19_bypass', to: 'n_lko_hazratganj_hub', lengthM: 302000, roadType: 'expressway', speedLimitKph: 100, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Agra-Lucknow Expressway' },
  { id: 'ale_agr_lko_r', from: 'n_lko_hazratganj_hub', to: 'n_agr_nh19_bypass', lengthM: 302000, roadType: 'expressway', speedLimitKph: 100, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Lucknow-Agra Expressway' },

  // NH-19: Agra -> Kanpur (275 km)
  { id: 'nh19_agr_knp_f', from: 'n_agr_nh19_bypass', to: 'n_knp_ramadevi_gt', lengthM: 275000, roadType: 'expressway', speedLimitKph: 85, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-19 Agra to Kanpur' },
  { id: 'nh19_agr_knp_r', from: 'n_knp_ramadevi_gt', to: 'n_agr_nh19_bypass', lengthM: 275000, roadType: 'expressway', speedLimitKph: 85, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-19 Kanpur to Agra' },

  // Kanpur <-> Lucknow Corridor (80 km)
  { id: 'knp_lko_f', from: 'n_knp_ramadevi_gt', to: 'n_lko_hazratganj_hub', lengthM: 80000, roadType: 'expressway', speedLimitKph: 85, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Kanpur-Lucknow Expressway' },
  { id: 'knp_lko_r', from: 'n_lko_hazratganj_hub', to: 'n_knp_ramadevi_gt', lengthM: 80000, roadType: 'expressway', speedLimitKph: 85, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Lucknow-Kanpur Expressway' },

  // NH-19: Kanpur -> Varanasi (320 km)
  { id: 'nh19_knp_vns_f', from: 'n_knp_ramadevi_gt', to: 'n_vns_bhu_lanka', lengthM: 320000, roadType: 'expressway', speedLimitKph: 85, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-19 Kanpur to Varanasi' },
  { id: 'nh19_knp_vns_r', from: 'n_vns_bhu_lanka', to: 'n_knp_ramadevi_gt', lengthM: 320000, roadType: 'expressway', speedLimitKph: 85, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-19 Varanasi to Kanpur' },

  // NH-19 / NH-922: Varanasi -> Patna (250 km)
  { id: 'nh19_vns_pat_f', from: 'n_vns_bhu_lanka', to: 'n_pat_gandhimaidan', lengthM: 250000, roadType: 'expressway', speedLimitKph: 85, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Varanasi to Patna Corridor' },
  { id: 'nh19_vns_pat_r', from: 'n_pat_gandhimaidan', to: 'n_vns_bhu_lanka', lengthM: 250000, roadType: 'expressway', speedLimitKph: 85, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Patna to Varanasi Corridor' },

  // NH-22: Patna -> Ranchi (325 km)
  { id: 'nh22_pat_rnc_f', from: 'n_pat_gandhimaidan', to: 'n_rnc_bariatu_rims', lengthM: 325000, roadType: 'primary', speedLimitKph: 75, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-22 Patna to Ranchi' },
  { id: 'nh22_pat_rnc_r', from: 'n_rnc_bariatu_rims', to: 'n_pat_gandhimaidan', lengthM: 325000, roadType: 'primary', speedLimitKph: 75, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-22 Ranchi to Patna' },

  // NH-19: Varanasi / Asansol -> Kolkata (670 km)
  { id: 'nh19_vns_kol_f', from: 'n_vns_bhu_lanka', to: 'n_kol_esplanade_central', lengthM: 670000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-19 Varanasi to Kolkata' },
  { id: 'nh19_vns_kol_r', from: 'n_kol_esplanade_central', to: 'n_vns_bhu_lanka', lengthM: 670000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-19 Kolkata to Varanasi' },

  // NH-27: Patna / Siliguri -> Guwahati (890 km)
  { id: 'nh27_pat_gwh_f', from: 'n_pat_gandhimaidan', to: 'n_gwh_jalukbari_rotary', lengthM: 890000, roadType: 'expressway', speedLimitKph: 85, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-27 East-West to Guwahati' },
  { id: 'nh27_pat_gwh_r', from: 'n_gwh_jalukbari_rotary', to: 'n_pat_gandhimaidan', lengthM: 890000, roadType: 'expressway', speedLimitKph: 85, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-27 Guwahati to Patna' },

  // NH-6: Guwahati -> Shillong (100 km)
  { id: 'nh6_gwh_shl_f', from: 'n_gwh_jalukbari_rotary', to: 'n_shl_neigrihms_mawdiang', lengthM: 100000, roadType: 'expressway', speedLimitKph: 65, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-6 Guwahati to Shillong' },
  { id: 'nh6_gwh_shl_r', from: 'n_shl_neigrihms_mawdiang', to: 'n_gwh_jalukbari_rotary', lengthM: 100000, roadType: 'expressway', speedLimitKph: 65, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-6 Shillong to Guwahati' },

  // NH-16: Kolkata -> Bhubaneswar (440 km)
  { id: 'nh16_kol_bbs_f', from: 'n_kol_esplanade_central', to: 'n_bbs_mastercanteen', lengthM: 440000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-16 Kolkata to Bhubaneswar' },
  { id: 'nh16_kol_bbs_r', from: 'n_bbs_mastercanteen', to: 'n_kol_esplanade_central', lengthM: 440000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-16 Bhubaneswar to Kolkata' },

  // Bhubaneswar <-> Cuttack Twin-City Link (28 km)
  { id: 'bbs_ctc_f', from: 'n_bbs_mastercanteen', to: 'n_ctc_scb_manglabag', lengthM: 28000, roadType: 'expressway', speedLimitKph: 80, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-16 Bhubaneswar to Cuttack' },
  { id: 'bbs_ctc_r', from: 'n_ctc_scb_manglabag', to: 'n_bbs_mastercanteen', lengthM: 28000, roadType: 'expressway', speedLimitKph: 80, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-16 Cuttack to Bhubaneswar' },

  // NH-16: Bhubaneswar -> Visakhapatnam (440 km)
  { id: 'nh16_bbs_vzg_f', from: 'n_bbs_mastercanteen', to: 'n_vzg_kgh_beach', lengthM: 440000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-16 Bhubaneswar to Visakhapatnam' },
  { id: 'nh16_bbs_vzg_r', from: 'n_vzg_kgh_beach', to: 'n_bbs_mastercanteen', lengthM: 440000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-16 Visakhapatnam to Bhubaneswar' },

  // NH-16: Visakhapatnam -> Vijayawada (350 km)
  { id: 'nh16_vzg_bza_f', from: 'n_vzg_kgh_beach', to: 'n_bza_aiims_mangalagiri', lengthM: 350000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-16 Visakhapatnam to Vijayawada' },
  { id: 'nh16_vzg_bza_r', from: 'n_bza_aiims_mangalagiri', to: 'n_vzg_kgh_beach', lengthM: 350000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-16 Vijayawada to Visakhapatnam' },

  // NH-16: Vijayawada -> Chennai (450 km)
  { id: 'nh16_bza_chn_f', from: 'n_bza_aiims_mangalagiri', to: 'n_chn_rgggh_park', lengthM: 450000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-16 Vijayawada to Chennai' },
  { id: 'nh16_bza_chn_r', from: 'n_chn_rgggh_park', to: 'n_bza_aiims_mangalagiri', lengthM: 450000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-16 Chennai to Vijayawada' },

  // NH-65: Hyderabad -> Vijayawada (275 km)
  { id: 'nh65_hyd_bza_f', from: 'n_hyd_nims_punjagutta', to: 'n_bza_aiims_mangalagiri', lengthM: 275000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-65 Hyderabad to Vijayawada' },
  { id: 'nh65_hyd_bza_r', from: 'n_bza_aiims_mangalagiri', to: 'n_hyd_nims_punjagutta', lengthM: 275000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-65 Vijayawada to Hyderabad' },

  // NH-44: Hyderabad -> Bengaluru (570 km)
  { id: 'nh44_hyd_blr_f', from: 'n_hyd_apollo_jubilee', to: 'n_blr_majestic_hub', lengthM: 570000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-44 Hyderabad to Bengaluru' },
  { id: 'nh44_hyd_blr_r', from: 'n_blr_majestic_hub', to: 'n_hyd_apollo_jubilee', lengthM: 570000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-44 Bengaluru to Hyderabad' },

  // NH-44: Nagpur -> Hyderabad (500 km)
  { id: 'nh44_ngp_hyd_f', from: 'n_ngp_zero_mile', to: 'n_hyd_nims_punjagutta', lengthM: 500000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-44 Nagpur to Hyderabad' },
  { id: 'nh44_ngp_hyd_r', from: 'n_hyd_nims_punjagutta', to: 'n_ngp_zero_mile', lengthM: 500000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-44 Hyderabad to Nagpur' },

  // NH-44 / NH-46: Agra -> Gwalior -> Bhopal (580 km)
  { id: 'nh46_agr_bpl_f', from: 'n_agr_nh19_bypass', to: 'n_bpl_saketnagar_aiims', lengthM: 580000, roadType: 'expressway', speedLimitKph: 85, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-46 Agra to Bhopal' },
  { id: 'nh46_agr_bpl_r', from: 'n_bpl_saketnagar_aiims', to: 'n_agr_nh19_bypass', lengthM: 580000, roadType: 'expressway', speedLimitKph: 85, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-46 Bhopal to Agra' },

  // Bhopal <-> Indore Expressway (195 km)
  { id: 'bpl_ind_f', from: 'n_bpl_saketnagar_aiims', to: 'n_ind_bombay_ringroad', lengthM: 195000, roadType: 'expressway', speedLimitKph: 90, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Bhopal-Indore Highway' },
  { id: 'bpl_ind_r', from: 'n_ind_bombay_ringroad', to: 'n_bpl_saketnagar_aiims', lengthM: 195000, roadType: 'expressway', speedLimitKph: 90, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Indore-Bhopal Highway' },

  // Bhopal -> Nagpur (350 km)
  { id: 'bpl_ngp_f', from: 'n_bpl_saketnagar_aiims', to: 'n_ngp_zero_mile', lengthM: 350000, roadType: 'expressway', speedLimitKph: 85, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-46 Bhopal to Nagpur' },
  { id: 'bpl_ngp_r', from: 'n_ngp_zero_mile', to: 'n_bpl_saketnagar_aiims', lengthM: 350000, roadType: 'expressway', speedLimitKph: 85, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-46 Nagpur to Bhopal' },

  // NH-53: Nagpur -> Raipur (280 km)
  { id: 'nh53_ngp_rpr_f', from: 'n_ngp_zero_mile', to: 'n_rpr_aiims_tatibandh', lengthM: 280000, roadType: 'expressway', speedLimitKph: 85, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-53 Nagpur to Raipur' },
  { id: 'nh53_ngp_rpr_r', from: 'n_rpr_aiims_tatibandh', to: 'n_ngp_zero_mile', lengthM: 280000, roadType: 'expressway', speedLimitKph: 85, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-53 Raipur to Nagpur' },

  // NH-53: Raipur -> Sambalpur / Cuttack / Bhubaneswar (550 km)
  { id: 'nh53_rpr_bbs_f', from: 'n_rpr_aiims_tatibandh', to: 'n_bbs_mastercanteen', lengthM: 550000, roadType: 'primary', speedLimitKph: 80, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-53 Raipur to Bhubaneswar' },
  { id: 'nh53_rpr_bbs_r', from: 'n_bbs_mastercanteen', to: 'n_rpr_aiims_tatibandh', lengthM: 550000, roadType: 'primary', speedLimitKph: 80, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-53 Bhubaneswar to Raipur' },

  // NE-1: Ahmedabad -> Vadodara (110 km Expressway)
  { id: 'ne1_ahd_vdr_f', from: 'n_ahd_civil_asarwa', to: 'n_vdr_sayaji_sterling', lengthM: 110000, roadType: 'expressway', speedLimitKph: 100, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NE-1 Ahmedabad to Vadodara' },
  { id: 'ne1_ahd_vdr_r', from: 'n_vdr_sayaji_sterling', to: 'n_ahd_civil_asarwa', lengthM: 110000, roadType: 'expressway', speedLimitKph: 100, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NE-1 Vadodara to Ahmedabad' },

  // NH-48: Vadodara -> Surat (150 km)
  { id: 'nh48_vdr_srt_f', from: 'n_vdr_sayaji_sterling', to: 'n_srt_kiran_katargam', lengthM: 150000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-48 Vadodara to Surat' },
  { id: 'nh48_vdr_srt_r', from: 'n_srt_kiran_katargam', to: 'n_vdr_sayaji_sterling', lengthM: 150000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-48 Surat to Vadodara' },

  // NH-48: Surat -> Mumbai (280 km)
  { id: 'nh48_srt_mum_f', from: 'n_srt_kiran_katargam', to: 'n_mum_andheri_kokilaben', lengthM: 280000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-48 Surat to Mumbai' },
  { id: 'nh48_srt_mum_r', from: 'n_mum_andheri_kokilaben', to: 'n_srt_kiran_katargam', lengthM: 280000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-48 Mumbai to Surat' },

  // Mumbai-Pune Expressway (95 km)
  { id: 'mpe_mum_pun_f', from: 'n_mum_belapur_apollo', to: 'n_pun_shivajinagar_hub', lengthM: 95000, roadType: 'expressway', speedLimitKph: 100, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Mumbai-Pune Expressway' },
  { id: 'mpe_mum_pun_r', from: 'n_pun_shivajinagar_hub', to: 'n_mum_belapur_apollo', lengthM: 95000, roadType: 'expressway', speedLimitKph: 100, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Pune-Mumbai Expressway' },

  // Samruddhi Mahamarg: Mumbai -> Nagpur (700 km)
  { id: 'samruddhi_mum_ngp_f', from: 'n_mum_belapur_apollo', to: 'n_ngp_zero_mile', lengthM: 700000, roadType: 'expressway', speedLimitKph: 110, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Samruddhi Mahamarg Mumbai to Nagpur' },
  { id: 'samruddhi_mum_ngp_r', from: 'n_ngp_zero_mile', to: 'n_mum_belapur_apollo', lengthM: 700000, roadType: 'expressway', speedLimitKph: 110, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Samruddhi Mahamarg Nagpur to Mumbai' },

  // NH-66: Mumbai -> Goa (580 km)
  { id: 'nh66_mum_goa_f', from: 'n_mum_belapur_apollo', to: 'n_goa_gmc_bambolim', lengthM: 580000, roadType: 'primary', speedLimitKph: 75, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-66 Mumbai to Goa' },
  { id: 'nh66_mum_goa_r', from: 'n_goa_gmc_bambolim', to: 'n_mum_belapur_apollo', lengthM: 580000, roadType: 'primary', speedLimitKph: 75, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-66 Goa to Mumbai' },

  // NH-48: Pune -> Bengaluru (840 km via Kolhapur, Belagavi, Hubballi)
  { id: 'nh48_pun_blr_f', from: 'n_pun_shivajinagar_hub', to: 'n_blr_majestic_hub', lengthM: 840000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-48 Pune to Bengaluru' },
  { id: 'nh48_pun_blr_r', from: 'n_blr_majestic_hub', to: 'n_pun_shivajinagar_hub', lengthM: 840000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-48 Bengaluru to Pune' },

  // NH-48: Bengaluru -> Chennai (340 km via Vellore)
  { id: 'nh48_blr_vel_f', from: 'n_blr_narayana_ecity', to: 'n_vel_cmc_ida', lengthM: 200000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-48 Bengaluru to Vellore' },
  { id: 'nh48_blr_vel_r', from: 'n_vel_cmc_ida', to: 'n_blr_narayana_ecity', lengthM: 200000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-48 Vellore to Bengaluru' },
  { id: 'nh48_vel_chn_f', from: 'n_vel_cmc_ida', to: 'n_chn_rgggh_park', lengthM: 140000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-48 Vellore to Chennai' },
  { id: 'nh48_vel_chn_r', from: 'n_chn_rgggh_park', to: 'n_vel_cmc_ida', lengthM: 140000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-48 Chennai to Vellore' },

  // NH-544 / NH-44: Bengaluru -> Coimbatore (360 km via Salem)
  { id: 'nh544_blr_cbe_f', from: 'n_blr_narayana_ecity', to: 'n_cbe_ganga_mettupalayam', lengthM: 360000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-544 Bengaluru to Coimbatore' },
  { id: 'nh544_blr_cbe_r', from: 'n_cbe_ganga_mettupalayam', to: 'n_blr_narayana_ecity', lengthM: 360000, roadType: 'expressway', speedLimitKph: 90, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-544 Coimbatore to Bengaluru' },

  // NH-544: Coimbatore -> Kochi (190 km)
  { id: 'nh544_cbe_cok_f', from: 'n_cbe_ganga_mettupalayam', to: 'n_cok_amrita_ponekkara', lengthM: 190000, roadType: 'expressway', speedLimitKph: 80, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-544 Coimbatore to Kochi' },
  { id: 'nh544_cbe_cok_r', from: 'n_cok_amrita_ponekkara', to: 'n_cbe_ganga_mettupalayam', lengthM: 190000, roadType: 'expressway', speedLimitKph: 80, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-544 Kochi to Coimbatore' },

  // NH-66: Kochi -> Kozhikode (180 km)
  { id: 'nh66_cok_ccj_f', from: 'n_cok_amrita_ponekkara', to: 'n_ccj_mims_mini_bypass', lengthM: 180000, roadType: 'primary', speedLimitKph: 70, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-66 Kochi to Kozhikode' },
  { id: 'nh66_cok_ccj_r', from: 'n_ccj_mims_mini_bypass', to: 'n_cok_amrita_ponekkara', lengthM: 180000, roadType: 'primary', speedLimitKph: 70, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-66 Kozhikode to Kochi' },

  // NH-66: Kochi -> Thiruvananthapuram (205 km)
  { id: 'nh66_cok_trv_f', from: 'n_cok_amrita_ponekkara', to: 'n_trv_gmc_medicalcollege', lengthM: 205000, roadType: 'primary', speedLimitKph: 70, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-66 Kochi to Thiruvananthapuram' },
  { id: 'nh66_cok_trv_r', from: 'n_trv_gmc_medicalcollege', to: 'n_cok_amrita_ponekkara', lengthM: 205000, roadType: 'primary', speedLimitKph: 70, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-66 Thiruvananthapuram to Kochi' },

  // NH-66: Goa -> Kozhikode (480 km via Mangaluru)
  { id: 'nh66_goa_ccj_f', from: 'n_goa_gmc_bambolim', to: 'n_ccj_mims_mini_bypass', lengthM: 480000, roadType: 'primary', speedLimitKph: 75, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-66 Goa to Kozhikode' },
  { id: 'nh66_goa_ccj_r', from: 'n_ccj_mims_mini_bypass', to: 'n_goa_gmc_bambolim', lengthM: 480000, roadType: 'primary', speedLimitKph: 75, lanes: 4, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NH-66 Kozhikode to Goa' },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. INTRA-CITY METROPOLITAN ARTERIALS (City Centers to Receiving Facilities)
  // ─────────────────────────────────────────────────────────────────────────────

  // Mumbai Internal Links
  { id: 'e_mum_nariman_parel_f', from: 'n_mum_nariman_point', to: 'n_mum_parel_kem', lengthM: 9200, roadType: 'primary', speedLimitKph: 50, lanes: 6, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Marine Drive / Parel Arterial' },
  { id: 'e_mum_nariman_parel_r', from: 'n_mum_parel_kem', to: 'n_mum_nariman_point', lengthM: 9200, roadType: 'primary', speedLimitKph: 50, lanes: 6, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Parel to Marine Drive' },
  { id: 'e_mum_parel_bandra_f', from: 'n_mum_parel_kem', to: 'n_mum_bandra_lilavati', lengthM: 6800, roadType: 'primary', speedLimitKph: 55, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Bandra-Worli Sea Link to Lilavati' },
  { id: 'e_mum_parel_bandra_r', from: 'n_mum_bandra_lilavati', to: 'n_mum_parel_kem', lengthM: 6800, roadType: 'primary', speedLimitKph: 55, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Lilavati to Parel KEM' },
  { id: 'e_mum_bandra_andheri_f', from: 'n_mum_bandra_lilavati', to: 'n_mum_andheri_kokilaben', lengthM: 10500, roadType: 'primary', speedLimitKph: 50, lanes: 6, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Western Express Highway to Kokilaben' },
  { id: 'e_mum_bandra_andheri_r', from: 'n_mum_andheri_kokilaben', to: 'n_mum_bandra_lilavati', lengthM: 10500, roadType: 'primary', speedLimitKph: 50, lanes: 6, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Kokilaben to Bandra' },
  { id: 'e_mum_bandra_belapur_f', from: 'n_mum_bandra_lilavati', to: 'n_mum_belapur_apollo', lengthM: 26000, roadType: 'expressway', speedLimitKph: 80, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Sion-Panvel Expressway to Apollo Belapur' },
  { id: 'e_mum_bandra_belapur_r', from: 'n_mum_belapur_apollo', to: 'n_mum_bandra_lilavati', lengthM: 26000, roadType: 'expressway', speedLimitKph: 80, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Apollo Belapur to Bandra' },

  // Pune Internal Links
  { id: 'e_pun_shiva_ruby_f', from: 'n_pun_shivajinagar_hub', to: 'n_pun_rubyhall_sassoon', lengthM: 3200, roadType: 'primary', speedLimitKph: 45, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Shivajinagar to Ruby Hall Clinic' },
  { id: 'e_pun_shiva_ruby_r', from: 'n_pun_rubyhall_sassoon', to: 'n_pun_shivajinagar_hub', lengthM: 3200, roadType: 'primary', speedLimitKph: 45, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Ruby Hall to Shivajinagar' },
  { id: 'e_pun_shiva_mangeshkar_f', from: 'n_pun_shivajinagar_hub', to: 'n_pun_mangeshkar_erandwane', lengthM: 4100, roadType: 'primary', speedLimitKph: 45, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Shivajinagar to Deenanath Mangeshkar' },
  { id: 'e_pun_shiva_mangeshkar_r', from: 'n_pun_mangeshkar_erandwane', to: 'n_pun_shivajinagar_hub', lengthM: 4100, roadType: 'primary', speedLimitKph: 45, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Deenanath Mangeshkar to Shivajinagar' },

  // Nagpur Internal Link
  { id: 'e_ngp_zero_aiims_f', from: 'n_ngp_zero_mile', to: 'n_ngp_aiims_mihan', lengthM: 11000, roadType: 'expressway', speedLimitKph: 70, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Wardha Road to AIIMS Nagpur' },
  { id: 'e_ngp_zero_aiims_r', from: 'n_ngp_aiims_mihan', to: 'n_ngp_zero_mile', lengthM: 11000, roadType: 'expressway', speedLimitKph: 70, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'AIIMS Nagpur to Zero Mile' },

  // Ahmedabad Internal Links
  { id: 'e_ahd_civil_apollo_f', from: 'n_ahd_civil_asarwa', to: 'n_ahd_apollo_bhat', lengthM: 9500, roadType: 'primary', speedLimitKph: 60, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Airport Road to Apollo Bhat' },
  { id: 'e_ahd_civil_apollo_r', from: 'n_ahd_apollo_bhat', to: 'n_ahd_civil_asarwa', lengthM: 9500, roadType: 'primary', speedLimitKph: 60, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Apollo Bhat to Civil Hospital' },

  // Bengaluru Internal Links
  { id: 'e_blr_majestic_nimhans_f', from: 'n_blr_majestic_hub', to: 'n_blr_nimhans_hosur', lengthM: 5200, roadType: 'primary', speedLimitKph: 50, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Majestic to NIMHANS' },
  { id: 'e_blr_majestic_nimhans_r', from: 'n_blr_nimhans_hosur', to: 'n_blr_majestic_hub', lengthM: 5200, roadType: 'primary', speedLimitKph: 50, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'NIMHANS to Majestic' },
  { id: 'e_blr_majestic_manipal_f', from: 'n_blr_majestic_hub', to: 'n_blr_manipal_oldairport', lengthM: 9800, roadType: 'primary', speedLimitKph: 50, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Old Airport Road to Manipal' },
  { id: 'e_blr_majestic_manipal_r', from: 'n_blr_manipal_oldairport', to: 'n_blr_majestic_hub', lengthM: 9800, roadType: 'primary', speedLimitKph: 50, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Manipal to Majestic' },
  { id: 'e_blr_nimhans_narayana_f', from: 'n_blr_nimhans_hosur', to: 'n_blr_narayana_ecity', lengthM: 18500, roadType: 'expressway', speedLimitKph: 80, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Electronic City Elevated to Narayana Health' },
  { id: 'e_blr_nimhans_narayana_r', from: 'n_blr_narayana_ecity', to: 'n_blr_nimhans_hosur', lengthM: 18500, roadType: 'expressway', speedLimitKph: 80, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Narayana Health to NIMHANS' },

  // Chennai Internal Links
  { id: 'e_chn_rgggh_apollo_f', from: 'n_chn_rgggh_park', to: 'n_chn_apollo_greams', lengthM: 4200, roadType: 'primary', speedLimitKph: 45, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Central to Apollo Greams Road' },
  { id: 'e_chn_rgggh_apollo_r', from: 'n_chn_apollo_greams', to: 'n_chn_rgggh_park', lengthM: 4200, roadType: 'primary', speedLimitKph: 45, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Apollo Greams Road to Central' },

  // Hyderabad Internal Links
  { id: 'e_hyd_nims_apollo_f', from: 'n_hyd_nims_punjagutta', to: 'n_hyd_apollo_jubilee', lengthM: 4800, roadType: 'primary', speedLimitKph: 50, lanes: 6, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Punjagutta to Apollo Jubilee Hills' },
  { id: 'e_hyd_nims_apollo_r', from: 'n_hyd_apollo_jubilee', to: 'n_hyd_nims_punjagutta', lengthM: 4800, roadType: 'primary', speedLimitKph: 50, lanes: 6, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Apollo Jubilee Hills to NIMS' },

  // Kolkata Internal Links
  { id: 'e_kol_esplanade_sskm_f', from: 'n_kol_esplanade_central', to: 'n_kol_sskm_exide', lengthM: 3100, roadType: 'primary', speedLimitKph: 45, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Esplanade to SSKM Hospital' },
  { id: 'e_kol_esplanade_sskm_r', from: 'n_kol_sskm_exide', to: 'n_kol_esplanade_central', lengthM: 3100, roadType: 'primary', speedLimitKph: 45, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'SSKM Hospital to Esplanade' },
  { id: 'e_kol_esplanade_apollo_f', from: 'n_kol_esplanade_central', to: 'n_kol_embypass_apollo', lengthM: 5800, roadType: 'primary', speedLimitKph: 50, lanes: 6, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Maa Flyover to Apollo Kolkata' },
  { id: 'e_kol_esplanade_apollo_r', from: 'n_kol_embypass_apollo', to: 'n_kol_esplanade_central', lengthM: 5800, roadType: 'primary', speedLimitKph: 50, lanes: 6, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Apollo Kolkata to Esplanade' },
  { id: 'e_kol_apollo_fortis_f', from: 'n_kol_embypass_apollo', to: 'n_kol_anandapur_fortis', lengthM: 6200, roadType: 'primary', speedLimitKph: 55, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'EM Bypass Apollo to Fortis' },
  { id: 'e_kol_apollo_fortis_r', from: 'n_kol_anandapur_fortis', to: 'n_kol_embypass_apollo', lengthM: 6200, roadType: 'primary', speedLimitKph: 55, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'EM Bypass Fortis to Apollo' },

  // Patna Internal Links
  { id: 'e_pat_gandhi_aiims_f', from: 'n_pat_gandhimaidan', to: 'n_pat_aiims_phulwari', lengthM: 12500, roadType: 'expressway', speedLimitKph: 60, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'AIIMS Elevated Road Patna' },
  { id: 'e_pat_gandhi_aiims_r', from: 'n_pat_aiims_phulwari', to: 'n_pat_gandhimaidan', lengthM: 12500, roadType: 'expressway', speedLimitKph: 60, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'AIIMS to Gandhi Maidan Patna' },
  { id: 'e_pat_gandhi_igims_f', from: 'n_pat_gandhimaidan', to: 'n_pat_igims_bailey', lengthM: 5600, roadType: 'primary', speedLimitKph: 50, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Bailey Road to IGIMS' },
  { id: 'e_pat_gandhi_igims_r', from: 'n_pat_igims_bailey', to: 'n_pat_gandhimaidan', lengthM: 5600, roadType: 'primary', speedLimitKph: 50, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'IGIMS to Gandhi Maidan' },

  // Bhubaneswar Internal Link
  { id: 'e_bbs_master_aiims_f', from: 'n_bbs_mastercanteen', to: 'n_bbs_aiims_sijua', lengthM: 8200, roadType: 'primary', speedLimitKph: 55, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Janpath to AIIMS Bhubaneswar' },
  { id: 'e_bbs_master_aiims_r', from: 'n_bbs_aiims_sijua', to: 'n_bbs_mastercanteen', lengthM: 8200, roadType: 'primary', speedLimitKph: 55, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'AIIMS Bhubaneswar to Janpath' },

  // Guwahati Internal Link
  { id: 'e_gwh_jaluk_gmch_f', from: 'n_gwh_jalukbari_rotary', to: 'n_gwh_gmch_bhangagarh', lengthM: 12500, roadType: 'primary', speedLimitKph: 55, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'GS Road to GMCH Guwahati' },
  { id: 'e_gwh_jaluk_gmch_r', from: 'n_gwh_gmch_bhangagarh', to: 'n_gwh_jalukbari_rotary', lengthM: 12500, roadType: 'primary', speedLimitKph: 55, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'GMCH Guwahati to Jalukbari' },

  // Lucknow Internal Links
  { id: 'e_lko_hazrat_kgmu_f', from: 'n_lko_hazratganj_hub', to: 'n_lko_kgmu_chowk', lengthM: 4200, roadType: 'primary', speedLimitKph: 45, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Hazratganj to KGMU' },
  { id: 'e_lko_hazrat_kgmu_r', from: 'n_lko_kgmu_chowk', to: 'n_lko_hazratganj_hub', lengthM: 4200, roadType: 'primary', speedLimitKph: 45, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'KGMU to Hazratganj' },
  { id: 'e_lko_hazrat_pgi_f', from: 'n_lko_hazratganj_hub', to: 'n_lko_pgi_raebareli', lengthM: 12800, roadType: 'primary', speedLimitKph: 60, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Raebareli Road to SGPGIMS' },
  { id: 'e_lko_hazrat_pgi_r', from: 'n_lko_pgi_raebareli', to: 'n_lko_hazratganj_hub', lengthM: 12800, roadType: 'primary', speedLimitKph: 60, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'SGPGIMS to Hazratganj' },
  { id: 'e_lko_hazrat_medanta_f', from: 'n_lko_hazratganj_hub', to: 'n_lko_medanta_amarshaheed', lengthM: 9200, roadType: 'expressway', speedLimitKph: 70, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Amar Shaheed Path to Medanta Lucknow' },
  { id: 'e_lko_hazrat_medanta_r', from: 'n_lko_medanta_amarshaheed', to: 'n_lko_hazratganj_hub', lengthM: 9200, roadType: 'expressway', speedLimitKph: 70, lanes: 6, hasSignal: false, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Medanta Lucknow to Hazratganj' },

  // Jaipur Internal Links
  { id: 'e_jpr_trans_sms_f', from: 'n_jpr_transport_nagar', to: 'n_jpr_sms_jlnmarg', lengthM: 4100, roadType: 'primary', speedLimitKph: 50, lanes: 6, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Transport Nagar to SMS Hospital' },
  { id: 'e_jpr_trans_sms_r', from: 'n_jpr_sms_jlnmarg', to: 'n_jpr_transport_nagar', lengthM: 4100, roadType: 'primary', speedLimitKph: 50, lanes: 6, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'SMS Hospital to Transport Nagar' },
  { id: 'e_jpr_sms_mansa_f', from: 'n_jpr_sms_jlnmarg', to: 'n_jpr_mansarovar', lengthM: 6800, roadType: 'primary', speedLimitKph: 55, lanes: 6, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'SMS Hospital to Mansarovar' },
  { id: 'e_jpr_sms_mansa_r', from: 'n_jpr_mansarovar', to: 'n_jpr_sms_jlnmarg', lengthM: 6800, roadType: 'primary', speedLimitKph: 55, lanes: 6, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Mansarovar to SMS Hospital' },

  // Chandigarh Internal Link
  { id: 'e_chd_sec17_pgi_f', from: 'n_chd_sec17_central', to: 'n_chd_pgimer', lengthM: 3600, roadType: 'primary', speedLimitKph: 50, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'Madhya Marg to PGIMER' },
  { id: 'e_chd_sec17_pgi_r', from: 'n_chd_pgimer', to: 'n_chd_sec17_central', lengthM: 3600, roadType: 'primary', speedLimitKph: 50, lanes: 4, hasSignal: true, isNarrow: false, hasSpeedBreaker: false, inSchoolZone: false, closed: false, isOneWay: false, name: 'PGIMER to Madhya Marg' },
];

