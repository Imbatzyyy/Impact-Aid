import { ADDITIONAL_QUESTIONS } from './quiz-extension';
// Interfaces
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Quiz {
  id: number;
  name: string;
  emoji: string;
  bg: string;
  allQuestions: QuizQuestion[];
  questions: QuizQuestion[];
}

/** Randomize question and answer order while preserving the correct answer. */
export function prepareQuiz(questions: QuizQuestion[], random = Math.random): QuizQuestion[] {
  const shuffle = <T>(input:T[]) => {
    const result=[...input];
    for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    return result;
  };
  return shuffle(questions).slice(0,15).map(q=>{
    const order=shuffle(q.options.map((_,i)=>i));
    return {...q,options:order.map(i=>q.options[i]),correctAnswer:order.indexOf(q.correctAnswer)};
  });
}

const BASE_QUIZZES: Quiz[] = [
  // EARTHQUAKE
  {
    id: 0,
    name: 'Earthquake',
    emoji: '🏔️',
    bg: 'bg-linear-to-r from-orange-400 to-red-500',
    questions: [],
    allQuestions: [
      { question: 'What is an earthquake?', options: ['A sudden shaking of the ground caused by a slip on a fault', 'A large ocean wave', 'A volcanic eruption', 'A heavy rainstorm'], correctAnswer: 0 },
      { question: 'Which fault system passes through the Greater Metro Manila Area?', options: ['Marikina Valley Fault System', 'San Andreas Fault', 'Philippine Trench', 'East Pacific Rise'], correctAnswer: 0 },
      { question: 'Earthquakes are caused mainly by:', options: ['Movement of tectonic plates', 'Weather changes', 'Ocean tides', 'Human activities'], correctAnswer: 0 },
      { question: 'What type of boundary occurs when two plates move apart?', options: ['Divergent boundary', 'Convergent boundary', 'Transform boundary', 'Subduction zone'], correctAnswer: 0 },
      { question: 'A convergent boundary involves:', options: ['Plates moving towards each other', 'Plates moving apart', 'Plates sliding past each other horizontally', 'Plates remaining stationary'], correctAnswer: 0 },
      { question: 'Transform boundaries involve:', options: ['Plates sliding horizontally past each other', 'Plates moving apart', 'Plates colliding vertically', 'Volcano formation'], correctAnswer: 0 },
      { question: 'Before an earthquake, it is important to:', options: ['Have a fire extinguisher and first aid kit ready', 'Store heavy objects on high shelves', 'Leave windows open', 'Avoid planning'], correctAnswer: 0 },
      { question: 'During an earthquake, if indoors you should:', options: ['Drop, cover your head and neck, and hold on', 'Run outside immediately', 'Go near windows', 'Use elevators'], correctAnswer: 0 },
      { question: 'After an earthquake, you should:', options: ['Check for injuries and gas leaks', 'Light candles', 'Use the telephone for non-emergencies', 'Enter damaged buildings'], correctAnswer: 0 },
      { question: 'What should you expect after a major earthquake?', options: ['Aftershocks', 'Complete calm', 'Immediate flooding', 'No further tremors'], correctAnswer: 0 },
      { question: 'The energy released by an earthquake travels in:', options: ['Sound waves', 'Seismic waves', 'Radio waves', 'Ocean waves'], correctAnswer: 1 },
      { question: 'The instrument used to measure earthquakes is called:', options: ['Barometer', 'Seismograph', 'Thermometer', 'Anemometer'], correctAnswer: 1 },
      { question: 'The point on the Earth\'s surface directly above the earthquake\'s origin is called the:', options: ['Focus', 'Epicenter', 'Fault line', 'Crust'], correctAnswer: 1 },
      { question: 'The underground origin point of an earthquake is:', options: ['Epicenter', 'Focus', 'Crust', 'Trench'], correctAnswer: 1 },
      { question: 'What should you do if you\'re outdoors during an earthquake?', options: ['Run inside a building', 'Stay in an open area away from power lines and buildings', 'Stand near trees', 'Get in a car'], correctAnswer: 1 },
      { question: 'When heavy objects fall during a quake, it is usually because they were:', options: ['Anchored well', 'On shelves or unsecured', 'Made of metal', 'Light'], correctAnswer: 1 },
      { question: 'After an earthquake, what is the safest place to be?', options: ['Inside a building with heavy furniture', 'Outdoors in an open area', 'Near windows', 'In a car on the road'], correctAnswer: 1 },
      { question: 'What is the cause of most earthquake damage?', options: ['Tsunamis', 'Earth shaking and structural collapse', 'Floods', 'Tornadoes'], correctAnswer: 1 },
      { question: 'How can you prepare your home against earthquakes?', options: ['Anchor heavy furniture and appliances', 'Place heavy objects on top shelves', 'Leave windows open', 'Store flammable liquids openly'], correctAnswer: 0 },
      { question: 'Electricity should be turned off after an earthquake if:', options: ['You want to save energy', 'You suspect damage to electrical wiring', 'You feel scared', 'The lights flicker once'], correctAnswer: 1 },
      { question: 'Which of the following is true about aftershocks?', options: ['They only occur before the main shock', 'Smaller tremors after a major quake', 'They happen only in specific countries', 'Always cause tsunami'], correctAnswer: 1 },
      { question: 'Before an earthquake, you should:', options: ['Learn first aid', 'Ignore preparedness', 'Leave all emergency supplies out in the open', 'Keep matches near fires'], correctAnswer: 0 },
      { question: 'After the shakes stop, what is the priority?', options: ['Check yourself and others for injuries', 'Use your car immediately', 'Start cooking', 'Turn on all electrical appliances'], correctAnswer: 0 },
      { question: 'Which of these should you NOT do during an earthquake?', options: ['Take cover under sturdy furniture', 'Protect your head and neck', 'Use matches or candles', 'Stay indoors'], correctAnswer: 2 },
      { question: 'What is a transform fault?', options: ['A fault where plates move horizontally past each other', 'Plates moving apart', 'Plates colliding and one going under another', 'Ocean ridge'], correctAnswer: 0 },
      { question: 'What natural disaster often follows an earthquake near the coast?', options: ['Tsunami', 'Flood', 'Hurricane', 'Tornado'], correctAnswer: 0 },
      { question: 'Which is true of a diverging plate boundary?', options: ['Plates move apart forming new crust', 'Plates slide sideways', 'Plates collide and subduct', 'Plates remain fixed'], correctAnswer: 0 },
      { question: 'After shaking stops, what should you do if you smell gas indoors?', options: ['Leave the area and report the leak from a safe location', 'Bake food', 'Switch the lights on', 'Use emergency exit elevators'], correctAnswer: 0 },
      { question: 'What\'s a good meeting plan after an earthquake?', options: ['Agree on safe locations to meet outside the home', 'Stay inside always', 'Move to basements', 'Go to nearest tall building'], correctAnswer: 0 },
      { question: 'Can scientists predict the exact time of the next earthquake?', options: ['No; prepare and follow official guidance', 'Yes, to the exact second', 'Only once a year globally', 'Earthquakes never happen'], correctAnswer: 0 }
    ]
  },
  // TSUNAMI
  {
    id: 1,
    name: 'Tsunami',
    emoji: '🌊',
    bg: 'bg-linear-to-r from-sky-400 to-blue-500',
    questions: [],
    allQuestions: [
      { question: 'The word "tsunami" means:', options: ['Harbor wave', 'Storm surge', 'Large rainwave', 'Earthquake wave'], correctAnswer: 0 },
      { question: 'What commonly triggers a tsunami?', options: ['Large underwater earthquake', 'Tornado', 'Huge snowfall', 'Landslide only'], correctAnswer: 0 },
      { question: 'What is a local tsunami?', options: ['A tsunami within 100 km of its source', 'A tsunami crossing the Pacific Ocean', 'A tidal wave far from source', 'A type of thunderstorm'], correctAnswer: 0 },
      { question: 'Why act on natural tsunami warnings immediately?', options: ['A local tsunami can arrive within minutes', 'An official alert always comes first', 'The first wave is always small', 'There is always a day to prepare'], correctAnswer: 0 },
      { question: 'What is a distant tsunami?', options: ['A tsunami that travels 1 to 24 hours before hitting a coast', 'A small wave near shore', 'An underwater volcanic eruption only', 'A flood caused by rivers'], correctAnswer: 0 },
      { question: 'Which is a sign of an incoming tsunami?', options: ['Ocean water suddenly pulling back significantly', 'Heavy rain', 'Overcast skies', 'Calm wind'], correctAnswer: 0 },
      { question: 'What sound might indicate a tsunami?', options: ['Roaring like a train or plane', 'Soft breeze', 'Silence', 'Birdsong'], correctAnswer: 0 },
      { question: 'What should you do if you feel an earthquake near the coast and experience any tsunami sign?', options: ['Drop, cover and hold on; once shaking stops, move inland or to high ground', 'Stay on the beach', 'Wait for official announcements', 'Swim to the ocean'], correctAnswer: 0 },
      { question: 'Where should you evacuate to during a tsunami?', options: ['To high ground or an officially designated tsunami evacuation structure', 'To the beach to watch', 'To the basement', 'To low-lying areas'], correctAnswer: 0 },
      { question: 'Can you surf a tsunami wave safely?', options: ['No', 'Yes', 'Only with a jet ski', 'At night'], correctAnswer: 0 },
      { question: 'What is the difference between a tsunami "warning" and "watch"?', options: ['Warning means a tsunami is likely imminent; watch means possible but uncertain threat', 'Watch means tsunami will hit; warning means no threat', 'Both mean the same', 'Watch means evacuation; warning means stay home'], correctAnswer: 0 },
      { question: 'What items should be in your tsunami emergency kit?', options: ['Water, food, cash, portable radio', 'Fireworks and candles', 'Only clothing', 'Bikes and balls'], correctAnswer: 0 },
      { question: 'How long can tsunami waves continue after the initial wave?', options: ['For hours, with waves of varying sizes', 'Only one wave lasts', 'Several minutes', 'None, tsunami ends immediately'], correctAnswer: 0 },
      { question: 'What should you NOT do after an initial tsunami wave?', options: ['Assume danger is over and return home', 'Stay alert for more waves', 'Follow official instructions', 'Help neighbors only if safe'], correctAnswer: 0 },
      { question: 'How safe is it to be in a building surrounded by water after a tsunami?', options: ['Not safe; floors and walls may collapse', 'Perfectly safe', 'Safer than open ground', 'Only safe if tall building'], correctAnswer: 0 },
      { question: 'If you cannot reach higher ground, how else can you evacuate?', options: ['Use a designated vertical evacuation structure according to the local plan', 'Stay in basement', 'Swim out to sea', 'Hide under furniture'], correctAnswer: 0 },
      { question: 'At sea during tsunami?', options: ['Follow maritime guidance to a safe depth away from threatened harbors', 'Sail towards shore', 'Dock immediately', 'Dive underwater'], correctAnswer: 0 },
      { question: 'How quickly should you evacuate after sensing tsunami signs?', options: ['Immediately, do not wait for official order', 'After pack your things carefully', 'Next morning', 'Only when police arrive'], correctAnswer: 0 },
      { question: 'What is one thing you should NOT do during a tsunami alert?', options: ['Go down to beach to watch waves', 'Take your pets with you', 'Move to evacuation site quickly', 'Follow evacuation route signs'], correctAnswer: 0 },
      { question: 'What should you do after returning from evacuation?', options: ['Follow local authorities\' safety advice carefully', 'Start rebuilding immediately', 'Ignore damaged utilities', 'Use matches freely'], correctAnswer: 0 },
      { question: 'What risks follow a tsunami?', options: ['Contaminated water, mudflows, damaged roads and bridges', 'Heat waves', 'Volcanic eruptions', 'None'], correctAnswer: 0 },
      { question: 'Who should you contact for help after tsunami?', options: ['Emergency services only if necessary', 'Family and friends for every small need', 'Media reporters', 'Random strangers'], correctAnswer: 0 },
      { question: 'What hygiene items became especially important during tsunami evacuation in COVID-19 times?', options: ['Hand sanitizer and non-medical masks', 'Face shields only', 'No special items needed', 'Colored ribbons'], correctAnswer: 0 },
      { question: 'How many days should you be prepared to stay self-sufficient after a tsunami?', options: ['At least three days', 'One day only', 'One week', 'One month'], correctAnswer: 0 },
      { question: 'Why is the word "tsunami" uniquely Japanese?', options: ['It is a Japanese term literally meaning "harbor wave"', 'Because tsunamis only happen in Japan', 'It was invented by scientists', 'It means "earthquake"'], correctAnswer: 0 },
      { question: 'What is a pyroclastic flow?', options: ['A hazard from volcanoes, not tsunamis, but related', 'A type of tsunami', 'Disease caused by floodwater', 'None of the above'], correctAnswer: 0 },
      { question: 'What is a seiche?', options: ['A standing wave in an enclosed or partially enclosed body of water sometimes triggered by earthquakes', 'A form of earthquake', 'A landslide', 'Fish migration'], correctAnswer: 0 },
      { question: 'Can tsunamis be caused by landslides?', options: ['Yes, underwater or onshore landslides can trigger tsunamis', 'No', 'Only by earthquakes', 'Only by volcanoes'], correctAnswer: 0 },
      { question: 'What technology is used to detect tsunamis?', options: ['Tsunami buoys and seismic detectors', 'Satellites only', 'Weather balloons', 'Animals'], correctAnswer: 0 },
      { question: 'What is the biggest warning sign of a distant tsunami?', options: ['Earthquake felt hours away from coast', 'Rainfall', 'Clouds disappear', 'Lightning'], correctAnswer: 0 }
    ]
  },
  // TYPHOON
  {
    id: 2,
    name: 'Typhoon',
    emoji: '🌀',
    bg: 'bg-linear-to-r from-violet-500 to-indigo-500',
    questions: [],
    allQuestions: [
      { question: 'A typhoon is also called:', options: ['Hurricane or cyclone', 'Tornado', 'Earthquake', 'Flood'], correctAnswer: 0 },
      { question: 'Typhoons form over:', options: ['Warm ocean waters (at least 26–27°C)', 'Polar regions', 'Deserts', 'Mountains'], correctAnswer: 0 },
      { question: 'A tropical cyclone with wind speeds below 34 knots is called a:', options: ['Tropical depression', 'Typhoon', 'Hurricane', 'Tornado'], correctAnswer: 0 },
      { question: 'What is the maximum wind speed of a tropical storm?', options: ['62 to 88 kph', 'Less than 34 knots', '100 knots or more', '10 kph'], correctAnswer: 0 },
      { question: 'What wind speed defines a Super Typhoon?', options: ['Over 185 kph (more than 100 knots)', 'Less than 62 kph', 'Between 50-70 kph', 'Below 30 knots'], correctAnswer: 0 },
      { question: 'Typhoons primarily rely on:', options: ['Warm ocean water and atmospheric instability', 'Cold air masses', 'Earthquake zones', 'Mountain rainfall'], correctAnswer: 0 },
      { question: 'What safety equipment is essential during a typhoon?', options: ['Emergency kit with food, water, medicines, and first aid', 'Video games', 'Large fishing boats', 'Air conditioners'], correctAnswer: 0 },
      { question: 'Why is trimming trees before a typhoon important?', options: ['Reduces the risk of falling branches causing injury or damage', 'For aesthetic reasons', 'To grow fruit better', 'To mark boundaries'], correctAnswer: 0 },
      { question: 'During a typhoon, you should avoid:', options: ['Using electrical appliances and landlines', 'Staying indoors', 'Turning off power', 'Preparing food'], correctAnswer: 0 },
      { question: 'When evacuating due to a typhoon, you must:', options: ['Take your emergency kit and important documents', 'Leave immediately without preparations', 'Wait for the storm to pass', 'Drive to the coast'], correctAnswer: 0 },
      { question: 'What is a crucial step after a typhoon?', options: ['Clean up safely using protective gear', 'Enter flooded buildings', 'Drink from any water source', 'Use electrical devices immediately'], correctAnswer: 0 },
      { question: 'Why should children be comforted after a typhoon?', options: ['To help them cope with trauma and fear', 'To encourage playing in floodwaters', 'To avoid talking about the storm', 'No special care is needed'], correctAnswer: 0 },
      { question: 'What is important for the health of your family after a typhoon?', options: ['Frequent handwashing and medical checkups for signs of illness', 'Eating only canned food', 'Avoiding water', 'Staying outside all day'], correctAnswer: 0 },
      { question: 'What is vertical evacuation?', options: ['Moving to higher floors or roofs during flooding or tsunamis', 'Evacuating by airplane', 'Moving to the basement', 'Swimming to safety'], correctAnswer: 0 },
      { question: 'What causes the cyclonic circulation in typhoons?', options: ['Earth\'s rotation (Coriolis effect)', 'Ocean currents', 'Mountain barriers', 'Sunspots'], correctAnswer: 0 },
      { question: 'What does \'low vertical wind shear\' mean for typhoon formation?', options: ['Winds do not change much with altitude, allowing storms to organize', 'Winds are very strong and destructive', 'Winds stop completely', 'None of the above'], correctAnswer: 0 },
      { question: 'Storm surges can cause:', options: ['Coastal flooding during typhoons', 'Earthquakes', 'Wildfires', 'Volcanic eruptions'], correctAnswer: 0 },
      { question: 'During a typhoon, avoid:', options: ['Going near fallen power lines or flooded areas', 'Staying at home', 'Following official warnings', 'Taking shelter indoors'], correctAnswer: 0 },
      { question: 'What document should you keep safe during a typhoon?', options: ['Important ID papers', 'Shopping list', 'Telephone book', 'School books'], correctAnswer: 0 },
      { question: 'What household preparations help protect against flying debris?', options: ['Installing storm shutters or boarding windows', 'Removing curtains', 'Opening windows wide', 'Placing lawn furniture outside'], correctAnswer: 0 },
      { question: 'Why should you avoid using plumbing during a storm?', options: ['Risk of electrocution from lightning striking water pipes', 'Pipes might break', 'Water tastes bad', 'Pipes freeze'], correctAnswer: 0 },
      { question: 'What is a severe tropical storm?', options: ['A cyclone with wind speeds of 87 to 117 kph', 'A cyclone with wind speeds less than 30 kph', 'A tornado', 'A tsunami'], correctAnswer: 0 },
      { question: 'The Philippines names typhoons differently than international names. Which agency is responsible?', options: ['PAGASA', 'NASA', 'NOAA', 'UN'], correctAnswer: 0 },
      { question: 'Why move vehicles to higher ground in rural areas before a typhoon?', options: ['To avoid flood damage', 'For better GPS signal', 'To clean vehicles', 'To avoid theft'], correctAnswer: 0 },
      { question: 'How can agricultural producers use spare time before a typhoon?', options: ['Harvest crops early', 'Plant new crops', 'Burn forests', 'Ignore warnings'], correctAnswer: 0 },
      { question: 'What is the safest place during a typhoon?', options: ['Designated shelter or inner room away from windows', 'Porch', 'Near large windows', 'Balcony'], correctAnswer: 0 },
      { question: 'Why is it important to unplug electrical appliances?', options: ['To prevent damage from power surges', 'To save electricity', 'To cool appliances', 'To reset circuits'], correctAnswer: 0 },
      { question: 'What should you do if someone is trapped during a typhoon?', options: ['Call emergency services', 'Try to rescue alone', 'Ignore', 'Wait days before reporting'], correctAnswer: 0 },
      { question: 'What causes the eye of a typhoon?', options: ['A calm, low-pressure center with descending air', 'A dense cloud', 'A lightning storm', 'Ocean current'], correctAnswer: 0 },
      { question: 'Which season has the most typhoon activity in the Philippines?', options: ['June to November', 'December to February', 'March to May', 'Year-round equally'], correctAnswer: 0 }
    ]
  },
  // FLOOD
  {
    id: 3,
    name: 'Flood',
    emoji: '💧',
    bg: 'bg-linear-to-r from-cyan-400 to-blue-500',
    questions: [],
    allQuestions: [
      { question: 'Floods occur when:', options: ['Normally dry land becomes submerged by water', 'Wind strengthens', 'Ground shakes', 'Sun shines brightly'], correctAnswer: 0 },
      { question: 'Flash floods develop:', options: ['Very rapidly after intense rainfall', 'Slowly over months', 'After earthquakes', 'Never'], correctAnswer: 0 },
      { question: 'Natural causes of floods include:', options: ['Heavy rain, storms, and tsunamis', 'Earthquakes only', 'Wildfires', 'Tornadoes'], correctAnswer: 0 },
      { question: 'Artificial causes of floods include:', options: ['Blasting hillsides, deforestation, failure of dams', 'Animal migration', 'Cloud computing', 'None'], correctAnswer: 0 },
      { question: 'Minor flooding usually:', options: ['Shallow and confined to low-lying areas', 'Causes city-wide disaster', 'Involves dam collapse', 'Is underwater volcanic eruption'], correctAnswer: 0 },
      { question: 'Major flooding can be caused by:', options: ['Overflowing rivers and dam breaks', 'Earthquakes only', 'Tornadoes only', 'High pressure systems'], correctAnswer: 0 },
      { question: 'What do "check valves" in sewer traps do?', options: ['Prevent floodwater backing up into homes', 'Increase water pressure', 'Clean water automatically', 'Drain water faster'], correctAnswer: 0 },
      { question: 'What should you do when flood warning comes?', options: ['Prepare emergency kit and evacuation plan', 'Continue normal activities', 'Open all water taps', 'Leave windows open'], correctAnswer: 0 },
      { question: 'Why should you not walk in moving floodwater?', options: ['Six inches of moving water can knock a person down', 'Water is warm', 'You might get wet', 'Flow carries good luck'], correctAnswer: 0 },
      { question: 'How much water can float most passenger cars?', options: ['One foot', 'Six inches', 'Three feet', 'Ten feet'], correctAnswer: 0 },
      { question: 'When should you abandon a flooded car?', options: ['When water rises around it and you can safely move to higher ground', 'Immediately upon any water contact', 'Never', 'Only during daytime'], correctAnswer: 0 },
      { question: 'After a flood, what is crucial when returning home?', options: ['Wait for official advice and avoid flooded spots', 'Enter immediately to clean', 'Invite guests to show damage', 'Resume normal routine'], correctAnswer: 0 },
      { question: 'Floodwaters may contain:', options: ['Raw sewage, bacteria, viruses', 'Only clean water', 'Sand only', 'None'], correctAnswer: 0 },
      { question: 'Mosquitoes breed in standing water. What are the 3 Ds to prevent bites?', options: ['Drain, dress light clothing, defend with repellent', 'Dive, dance, drum', 'Dry, drink, dump', 'Drive, dig, dodge'], correctAnswer: 0 },
      { question: 'What should you do with wet contents like carpets and bedding after flood?', options: ['Remove immediately to prevent mold', 'Leave wet indefinitely', 'Burn them', 'Never remove'], correctAnswer: 0 },
      { question: 'Why avoid signing Assignment of Benefits for repairs?', options: ['It can lead to insurance fraud', 'It locks repairs forever', 'It is illegal', 'It\'s recommended'], correctAnswer: 0 },
      { question: 'What should you do before starting home repairs after a flood?', options: ['Get required permits', 'Proceed immediately', 'Ignore permits', 'Wait a year'], correctAnswer: 0 },
      { question: 'After flood, always:', options: ['Ask for identification before letting anyone into your home', 'Invite contractors without verification', 'Trust strangers', 'Ignore safety rules'], correctAnswer: 0 },
      { question: 'Flood insurance covers:', options: ['Repair costs from flood damage', 'Only fire damage', 'Theft only', 'All natural disasters'], correctAnswer: 0 },
      { question: 'What is a safe evacuation zone criterion?', options: ['Areas above expected flood levels', 'Low-lying areas', 'Near waterways', 'Flood plains'], correctAnswer: 0 },
      { question: 'What causes the most widespread damage in floods?', options: ['Currents carrying debris', 'Rain only', 'Snow melt alone', 'Drought'], correctAnswer: 0 },
      { question: 'Flood risk increases with:', options: ['Deforestation and poor land management', 'Tree planting', 'Rain barrels', 'Waste recycling'], correctAnswer: 0 },
      { question: 'Why is it important not to mix water with electrical appliances during a flood?', options: ['Risk of electrocution', 'Appliances will work better', 'Water improves conductivity', 'No risk at all'], correctAnswer: 0 },
      { question: 'After the flood, food should be:', options: ['Discarded if perishable and not kept cold', 'Stored without inspection', 'Kept outside', 'Avoided always'], correctAnswer: 0 },
      { question: 'How can you know your evacuation zone?', options: ['Check local government or emergency management websites', 'Guess based on prior floods', 'Follow friends only', 'Ignore official warnings'], correctAnswer: 0 },
      { question: 'What should be installed to prevent floodwater from backing into homes?', options: ['Check valves', 'Overflow dams', 'Extra drains', 'Sprinklers'], correctAnswer: 0 },
      { question: 'Why service septic tanks after flooding?', options: ['Prevent health hazards', 'Increase water flow', 'Grow plants', 'No reason'], correctAnswer: 0 },
      { question: 'What is price gouging?', options: ['Selling goods at higher than normal prices during emergencies', 'Discount sales', 'Pricing strategy year-round', 'Illegal practice unrelated to disasters'], correctAnswer: 0 },
      { question: 'Post-flood cleanup:', options: ['Use gloves and boots to avoid injuries', 'Bare hands is fine', 'Use only water', 'Do nothing'], correctAnswer: 0 },
      { question: 'Which agency often provides flood alerts?', options: ['Local emergency management offices', 'Schools only', 'Fire department only', 'None'], correctAnswer: 0 }
    ]
  },
  // LANDSLIDE
  {
    id: 4,
    name: 'Landslide',
    emoji: '⚠️',
    bg: 'bg-linear-to-r from-yellow-400 to-orange-500',
    questions: [],
    allQuestions: [
      { question: 'A landslide is:', options: ['Downhill movement of rock, soil, and debris due to gravity', 'Sudden sea wave', 'Flood event', 'Forest fire'], correctAnswer: 0 },
      { question: 'Key material in landslides includes:', options: ['Soil, rock, debris, garbage', 'Ice and snow', 'Water only', 'Dust only'], correctAnswer: 0 },
      { question: 'Natural triggers for landslides include:', options: ['Intense rainfall and earthquakes', 'Lightning', 'Tornado', 'Solar flares'], correctAnswer: 0 },
      { question: 'Man-made triggers of landslides include:', options: ['Deforestation and construction activities', 'Planting trees', 'Wildlife movement', 'Moon phases'], correctAnswer: 0 },
      { question: 'Movement types of landslides do NOT include:', options: ['Flow, slide, topple, fall, spread', 'Drift only', 'Fall', 'Slide'], correctAnswer: 1 },
      { question: 'Which group should be prioritized during evacuation?', options: ['Persons with disabilities (PWD), pregnant women, elderly, and children', 'Only adults', 'Pets only', 'Visitors'], correctAnswer: 0 },
      { question: 'Warning signs of a landslide include:', options: ['Increasingly muddy water in nearby streams', 'Clear water', 'Heavy winds', 'Sunny weather'], correctAnswer: 0 },
      { question: 'What sounds may warn a landslide?', options: ['Cracking trees, rushing water, rumbling rocks', 'Birdsong', 'Silence', 'Thunder'], correctAnswer: 0 },
      { question: 'What should you do if a landslide is occurring?', options: ['Move away from the path of moving debris if you can safely do so', 'Move downhill', 'Stay indoors', 'Stand still'], correctAnswer: 0 },
      { question: 'After a landslide, when should you return home?', options: ['Only after authorities say it\'s safe', 'Immediately', 'After one day', 'Never'], correctAnswer: 0 },
      { question: 'Landslides are more likely:', options: ['In areas that have experienced them before', 'In deserts only', 'Near the ocean only', 'In cities only'], correctAnswer: 0 },
      { question: 'How often should emergency supplies be updated?', options: ['Every year', 'Once every five years', 'Never', 'Every month'], correctAnswer: 0 },
      { question: 'What should you do if trapped in the path of a landslide?', options: ['Move out of the flow path toward stable ground if you can do so safely', 'Hide inside your house', 'Stay still', 'Run downhill or cross roads'], correctAnswer: 0 },
      { question: 'Why should you not return too soon to a landslide area?', options: ['The area may remain unstable and prone to another slide', 'It is always safe', 'No landslides will happen again', 'Roads are clear'], correctAnswer: 0 },
      { question: 'How can replanting help after a landslide?', options: ['Prevent erosion and future slides', 'Decorate the area', 'Attract tourists', 'None'], correctAnswer: 0 },
      { question: 'Listening to emergency broadcasts helps to:', options: ['Stay updated on weather and hazards', 'Enter unsafe zones', 'Ignore warnings', 'Plan parties'], correctAnswer: 0 },
      { question: 'Which sounds are NOT typical landslide warnings?', options: ['Birds singing', 'Cracking trees', 'Rushing water', 'Rumbling rocks'], correctAnswer: 0 },
      { question: 'How do weathering processes contribute to landslides?', options: ['Weaken rock and soil making slopes unstable', 'Strengthen soil', 'Cause drought', 'Increase wildlife'], correctAnswer: 0 },
      { question: 'Which structure\'s failure can lead to sudden flooding and landslides?', options: ['Dam', 'Bridge', 'Tower', 'Lighthouse'], correctAnswer: 0 },
      { question: 'Which place is safer during a landslide?', options: ['Stable ground outside the slide and its runout zone', 'Base of the slope', 'Riverbanks', 'Open field near slope'], correctAnswer: 0 },
      { question: 'What is "spread" in landslides?', options: ['Lateral movement of soil or rock over weak ground', 'Falling of rocks', 'Flooding', 'Tree fall'], correctAnswer: 0 },
      { question: 'What is "topple" movement?', options: ['Rotational movement of a rock mass about a pivot point', 'Falling straight down', 'Flood rush', 'Seismic activity'], correctAnswer: 0 },
      { question: 'Which human activity significantly increases landslide risk?', options: ['Deforestation', 'Planting trees', 'Building parks', 'Gardening'], correctAnswer: 0 },
      { question: 'What supplies are essential for landslide emergency kits?', options: ['First aid, flashlights, snacks, water', 'Clothing only', 'Toys', 'Books'], correctAnswer: 0 },
      { question: 'How do volcanic eruptions indirectly trigger landslides?', options: ['By producing mudflows (lahars)', 'By cooling the ground', 'By increasing rainfall', 'By sunlight'], correctAnswer: 0 },
      { question: 'Which is a warning sign of possible slope movement?', options: ['New or widening ground cracks on a slope', 'A steady indoor clock', 'A change in the moon phase', 'A passing cloud'], correctAnswer: 0 },
      { question: 'What kind of sediment is common in debris avalanches?', options: ['Rocks, soil, and loose material', 'Only water', 'Ice', 'Leaves'], correctAnswer: 0 },
      { question: 'How can urbanization increase landslide chances?', options: ['By disrupting natural drainage', 'By planting trees', 'By building dams only', 'By creating parks'], correctAnswer: 0 },
      { question: 'Why is proper waste disposal important regarding landslides?', options: ['Prevents drainage clogging and flooding', 'Makes landslide better', 'Has no effect', 'Improves soil stability'], correctAnswer: 0 },
      { question: 'How does blasting affect landslide risk?', options: ['Destabilizes slopes increasing risk', 'Strengthens rock', 'Has no effect', 'Reduces rainfall'], correctAnswer: 0 }
    ]
  },
  // VOLCANIC ERUPTION
  {
    id: 5,
    name: 'Volcanic Eruption',
    emoji: '🌋',
    bg: 'bg-linear-to-r from-red-500 to-pink-500',
    questions: [],
    allQuestions: [
      { question: 'A volcano is:', options: ['A vent or mountain where molten rock and gases escape', 'A river', 'An earthquake zone', 'A glacier'], correctAnswer: 0 },
      { question: 'Magma explodes out of a volcano because:', options: ['Pressure builds too high in magma chambers', 'It rains heavily', 'Earthquake alone', 'Wind pressure'], correctAnswer: 0 },
      { question: 'Effusive eruptions:', options: ['Produce gentle, steady lava flows', 'Are highly explosive', 'Cause tsunamis', 'Never occur'], correctAnswer: 0 },
      { question: 'Pyroclastic density currents are:', options: ['Fast, hot mixtures of ash and gas flowing down volcanoes', 'Slow lava flows', 'Tsunamis', 'Earthquakes'], correctAnswer: 0 },
      { question: 'Lahar is:', options: ['Volcanic mudflow caused when ash mixes with water', 'A smoke cloud', 'A type of earthquake', 'Lightning during eruption'], correctAnswer: 0 },
      { question: 'Volcanic gases released can cause:', options: ['Poisoning of air, water, and soil', 'Cooling of atmosphere', 'Reduced rainfall', 'None'], correctAnswer: 0 },
      { question: 'Volcanic tsunamis are:', options: ['Large waves generated by underwater volcanic activity', 'Floods from rivers', 'Hurricane related', 'Unrelated to volcanoes'], correctAnswer: 0 },
      { question: 'Which eruption type is less explosive and produces lava domes?', options: ['Thick and sticky magma eruptions', 'Effusive eruptions', 'Tsunami-induced eruptions', 'None'], correctAnswer: 0 },
      { question: 'What should be done for respiratory health before eruptions?', options: ['Consult a doctor if you have difficulties', 'Ignore symptoms', 'Stay outside', 'Exercise more'], correctAnswer: 0 },
      { question: 'What is the Volcano Notification Service ("VNS")?', options: ['A free alert service for volcanic activity', 'A weather channel', 'A satellite program', 'A seismic tool'], correctAnswer: 0 },
      { question: 'During an eruption, avoid:', options: ['Being downwind or in river valleys downstream', 'Wearing masks', 'Staying indoors', 'Listening to authorities'], correctAnswer: 0 },
      { question: 'Ashfall can cause:', options: ['Breathing irritation and damage to eyes and skin', 'Good air quality', 'Reduced fog', 'Hot weather'], correctAnswer: 0 },
      { question: 'Protective masks recommended during ashfall include:', options: ['N95 respirators', 'Scarves only', 'No masks', 'Surgical gloves'], correctAnswer: 0 },
      { question: 'Avoid driving during heavy ashfall because:', options: ['Ash can clog engines and stall vehicles', 'Ash improves road traction', 'Roads are clearer', 'None'], correctAnswer: 0 },
      { question: 'Why should you avoid removing ash from roofs without guidance?', options: ['Surfaces are slippery and roofs may collapse', 'Ash is easy to clean', 'Ash is light and harmless', 'Ash fixes roofs'], correctAnswer: 0 },
      { question: 'What clothes should you wear when cleaning volcanic ash?', options: ['Protective clothing and mask', 'Shorts and sandals', 'No clothes', 'Swimwear'], correctAnswer: 0 },
      { question: 'Who should avoid participation in cleanup efforts?', options: ['Children', 'Adults', 'Professionals', 'Volunteers'], correctAnswer: 0 },
      { question: 'What is a lateral blast?', options: ['A powerful sideways explosion from a volcano', 'Upward lava eruption', 'A calm ashfall', 'A river flood'], correctAnswer: 0 },
      { question: 'Ground deformation during eruption may cause:', options: ['Subsidence and fissuring', 'Floods', 'Strong winds', 'None'], correctAnswer: 0 },
      { question: 'Secondary explosions can occur:', options: ['After the initial eruption', 'Before eruption only', 'Not at all', 'During floods'], correctAnswer: 0 },
      { question: 'What dangers come from ballistic projectiles?', options: ['Large rock fragments thrown from a volcano', 'Ash clouds', 'Lightning strikes', 'Tornadoes'], correctAnswer: 0 },
      { question: 'Which of these gases is commonly released in eruptions?', options: ['Sulfur dioxide', 'Oxygen alone', 'Carbon monoxide only', 'Nitrogen only'], correctAnswer: 0 },
      { question: 'Volcanic hazards include:', options: ['Lava flows, ashfall, lahars, gas emissions', 'Only lava', 'Only rain', 'Only tornadoes'], correctAnswer: 0 },
      { question: 'How should you stay informed during volcanic activity?', options: ['Follow alerts and evacuation orders', 'Watch social media only', 'Stay indifferent', 'Ignore official advice'], correctAnswer: 0 },
      { question: 'Why is it important to have a shelter-in-place plan for ash?', options: ['Ash can contaminate air and water', 'To enjoy the view', 'Ash cleans air', 'No need'], correctAnswer: 0 },
      { question: 'How often do eruptions produce tsunamis?', options: ['Rarely, but possible near water', 'Always', 'Never', 'Only in winter'], correctAnswer: 0 },
      { question: 'Which volcanic eruption style produces the most explosive events?', options: ['Explosive eruptions with thick magma', 'Gentle effusive flows', 'None', 'Minor tremors'], correctAnswer: 0 },
      { question: 'Why create password-protected digital copies of important documents?', options: ['To safeguard during disasters', 'For fun', 'To share online', 'No reason'], correctAnswer: 0 },
      { question: 'Why avoid using phones right after an eruption?', options: ['Phone lines are busy for emergency use', 'Phones don\'t work', 'To save battery', 'No reason'], correctAnswer: 0 },
      { question: 'What is the best time to evacuate during volcanic activity?', options: ['Early, when ordered by authorities', 'After eruption peak', 'Never', 'During ashfall'], correctAnswer: 0 }
    ]
  }
];
export const QUIZ_DATA: Quiz[] = BASE_QUIZZES.map((q,i)=>({...q,allQuestions:[...q.allQuestions,...ADDITIONAL_QUESTIONS[i]]}));
