import { ChangeDetectionStrategy } from '@angular/core';
import { db, session, account, progressData, topics } from '../../services/backend';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

interface LessonContent {
  htmlContent: string;
}

interface Lesson {
  id: number;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  title: string;
  emoji: string;
  subtitle: string;
  textColor: string;
  iconGradient: string;
  borderGradient: string;
  content: LessonContent;
}

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-lessons',
  standalone: true,
  imports: [IonContent, IonIcon, CommonModule, RouterLink],
  templateUrl: './lessons.page.html',
  styleUrls: ['./lessons.page.scss'],
})
export class LessonsPage  {
  @ViewChild('scrollContent') scrollContent!: ElementRef;
  
  userId: string | null = null;
  selectedLesson: Lesson | null = null;
  videos=['earthquake/earthquake','tsunami/tsunami','typhoon/typhoon','flood/floods','landslide/landslide','volcano/volcano'];
  lessonsCompleted: number[] = [];
  showCompletionPopup: boolean = false;
  hasReachedBottom: boolean = false;
  scrollThreshold: number = 0.95; // 95% scroll threshold

  lessons: Lesson[] = [
    {
      id: 0,
      icon: 'planet-outline',
      color: '#f59e0b',
      bgColor: '#fef3c7',
      borderColor: '#fbbf24',
      title: 'Earthquake',
      emoji: '🏔️',
      subtitle: 'Learn what to do before, during, and after an earthquake',
      textColor: '#b45309',
      iconGradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
      borderGradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
      content: {
        htmlContent: `
          <div class="space-y-4 text-gray-700 leading-relaxed">
            <h3 class="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <ion-icon name="information-circle-outline" class="text-2xl"></ion-icon>
              What Is An Earthquake?
            </h3>
            
            

            <h4 class="text-md font-semibold text-gray-800 flex items-center gap-2 mt-6">
              <ion-icon name="link-outline" class="text-xl"></ion-icon>
              References:
            </h4>
            <ul class="list-disc ml-5 text-blue-600 text-sm space-y-1">
              <li><a href="https://www.usgs.gov" target="_blank" class="underline">What is an earthquake and what causes them to happen? | U.S. Geological Survey</a></li>
              <li><a href="https://www.ready.gov/earthquakes" target="_blank" class="underline">What Should I Do Before, During, and After an Earthquake?</a></li>
              <li><a href="https://oceanexplorer.noaa.gov" target="_blank" class="underline">What are the different types of plate tectonic boundaries? - NOAA Ocean Exploration</a></li>
            </ul>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="book-outline" class="text-xl"></ion-icon>
              Definition of Terms:
            </h4>
            <p class="bg-amber-50 p-4 rounded-xl border-l-4 border-amber-400">
              <strong class="text-amber-900">Earthquake</strong> - An earthquake is the sudden shaking of the ground caused by a sudden slip on a fault. 
              This mainly happens in active fault lines which are cracks or fractures in the Earth's crust in between tectonic plates.
              An example of an active fault line is the Marikina Valley Fault System in the Greater Metro Manila Area, with two main segments: 
              the West Valley Fault (WVF) and the East Valley Fault (EVF).
            </p>
            
            <div class="image-container">
              <img src="assets/lessons/earthquake/fault-map.jpg" alt="Marikina Valley Fault Map" class="w-full rounded-2xl shadow-md" />
            </div>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="help-circle-outline" class="text-xl"></ion-icon>
              Causes:
            </h4>
            <p class="bg-blue-50 p-4 rounded-xl">
              Earthquakes are caused by the movement, bumping, or sliding of tectonic plates that form the earth's crust. 
              The tectonic plates are always slowly moving, but they get stuck at their edges due to friction. 
              When the stress on the edge overcomes the friction, energy is released in waves that travel through the Earth's crust, 
              causing the shaking that we feel.
            </p>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="git-branch-outline" class="text-xl"></ion-icon>
              Types of Plate Boundaries:
            </h4>
            
            <div class="space-y-4">
              <div class="bg-linear-to-r from-purple-50 to-pink-50 p-4 rounded-xl">
                <p class="font-semibold text-purple-900 mb-2">
                  <ion-icon name="arrow-undo-outline" class="align-middle"></ion-icon>
                  Divergent Boundary
                </p>
                <p class="text-sm">From the Latin <em>dīvergere</em>, which means "to bend apart". Divergent boundaries happen when two tectonic plates move and break apart from each other.</p>
                <div class="image-container mt-3">
                  <img src="assets/lessons/earthquake/divergent.jpg" alt="Divergent Boundary" class="w-full rounded-xl shadow-sm" />
                </div>
              </div>

              <div class="bg-linear-to-r from-blue-50 to-cyan-50 p-4 rounded-xl">
                <p class="font-semibold text-blue-900 mb-2">
                  <ion-icon name="arrow-redo-outline" class="align-middle"></ion-icon>
                  Convergent Boundary
                </p>
                <p class="text-sm">From the Latin word <em>convergere</em>, meaning "to turn toward". Convergent boundaries happen when tectonic plates move toward each other, with one sliding beneath another (subduction).</p>
                <div class="image-container mt-3">
                  <img src="assets/lessons/earthquake/convergent.jpg" alt="Convergent Boundary" class="w-full rounded-xl shadow-sm" />
                </div>
              </div>

              <div class="bg-linear-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
                <p class="font-semibold text-green-900 mb-2">
                  <ion-icon name="swap-horizontal-outline" class="align-middle"></ion-icon>
                  Transform Boundary
                </p>
                <p class="text-sm">From the Latin word <em>transformare</em>, meaning "to change in shape". Transform faults happen when tectonic plates slide or move horizontally past one another.</p>
                <div class="image-container mt-3">
                  <img src="assets/lessons/earthquake/transform.jpg" alt="Transform Boundary" class="w-full rounded-xl shadow-sm" />
                </div>
              </div>
            </div>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="time-outline" class="text-xl"></ion-icon>
              What to Do Before an Earthquake
            </h4>
            <ul class="space-y-2 text-gray-700 text-sm">
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Make sure you have a fire extinguisher, first aid kit, battery-powered radio, flashlight, and extra batteries at home.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Learn first aid.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Learn how to turn off the gas, water, and electricity.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Make a plan of where to meet your family after an earthquake.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Secure heavy furniture, cupboards, and appliances to the wall or floor.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Learn your school or workplace's earthquake plan.</span>
              </li>
            </ul>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="alert-circle-outline" class="text-xl"></ion-icon>
              What to Do During an Earthquake
            </h4>
            <ul class="space-y-2 text-gray-700 text-sm">
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Stay calm! If indoors, stay inside. If outside, stay outside.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>If indoors, stay inside. Drop down, cover your head and neck under a sturdy table if nearby, and hold on until shaking stops. Keep away from windows and do not stand in doorways.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Stay away from windows, mirrors, and outside doors.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>If outdoors, move to open areas away from power lines or falling objects.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Do not use matches or any flame — gas leaks may occur.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>If in a car, stop and stay inside until the shaking stops.</span>
              </li>
            </ul>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="shield-checkmark-outline" class="text-xl"></ion-icon>
              What to Do After an Earthquake
            </h4>
            <ul class="space-y-2 text-gray-700 text-sm mb-8">
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Check yourself and others for injuries; provide first aid if needed.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Check for gas, water, and electric damage. Turn off valves if leaks occur.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Listen to radio updates; avoid phone use except for emergencies.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Stay out of damaged buildings and away from beaches (possible tsunamis).</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Be cautious of chimneys, glass, and debris.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Expect aftershocks and follow local emergency instructions.</span>
              </li>
            </ul>
          </div>
        `
      }
    },
    {
      id: 1,
      icon: 'water-outline',
      color: '#06b6d4',
      bgColor: '#cffafe',
      borderColor: '#22d3ee',
      title: 'Tsunami',
      emoji: '🌊',
      subtitle: 'Learn about tsunami causes, warning signs, and safety measures',
      textColor: '#0e7490',
      iconGradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
      borderGradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
      content: {
        htmlContent: `
          <div class="space-y-4 text-gray-700 leading-relaxed">
            <h3 class="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <ion-icon name="information-circle-outline" class="text-2xl"></ion-icon>
              What Is A Tsunami?
            </h3>
            
            

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="book-outline" class="text-xl"></ion-icon>
              Definition of Terms:
            </h4>
            <p class="bg-cyan-50 p-4 rounded-xl border-l-4 border-cyan-400">
              <strong class="text-cyan-900">Tsunami</strong> - The word "tsunami" is a Japanese term that literally means "harbor wave," combining the words "tsu" (harbor) and "nami" (wave). A tsunami is a large, disastrous ocean wave that happens near shore lines such as beaches, bays, etc.
            </p>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="help-circle-outline" class="text-xl"></ion-icon>
              Causes:
            </h4>
            <p class="bg-blue-50 p-4 rounded-xl">
              Tsunamis are often triggered by large earthquakes that occur near or under the ocean, volcanic eruptions, submarine landslides, or by onshore landslides in which large volumes of debris fall into the water. These phenomena cause a sudden displacement of a large volume of water underwater, creating pressure underwater, and when the underwater pressure surfaces, it creates large waves that make its way to coast lines, submerging them in water.
            </p>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="layers-outline" class="text-xl"></ion-icon>
              Types:
            </h4>
            
            <div class="image-container">
              <img src="assets/lessons/tsunami/types.gif" alt="Tsunami Types" class="w-full rounded-2xl shadow-md" />
            </div>

            <div class="space-y-4 mt-4">
              <div class="bg-linear-to-r from-cyan-50 to-blue-50 p-4 rounded-xl">
                <p class="font-semibold text-cyan-900 mb-2">
                  <ion-icon name="location-outline" class="align-middle"></ion-icon>
                  Local Tsunamis
                </p>
                <p class="text-sm">The coastal areas in the Philippines especially those facing the Pacific Ocean, South China Sea, Sulu Sea and Celebes Sea can be affected by tsunamis that may be generated by local earthquakes. Local tsunamis are confined to coasts within a hundred kilometers of the source, usually earthquakes and a landslide or a pyroclastics flow. It can reach the shoreline within 2 to 5 minutes.</p>
              </div>

              <div class="bg-linear-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                <p class="font-semibold text-blue-900 mb-2">
                  <ion-icon name="globe-outline" class="align-middle"></ion-icon>
                  Far Field or Distant Tsunamis
                </p>
                <p class="text-sm">Far field or distant tsunamis can travel from 1 to 24 hours before reaching the coast of the nearby countries. These tsunamis mainly come from the countries bordering the Pacific Ocean like Chile, Alaska in the USA and Japan.</p>
              </div>
            </div>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="eye-outline" class="text-xl"></ion-icon>
              How to Sense an Incoming Tsunami:
            </h4>
            <div class="image-container mb-3">
                  <img src="assets/lessons/tsunami/All.jpg" alt="Run to Safety" class="w-full rounded-xl shadow-sm" />
                </div>

            <div class="space-y-4">
              <div class="bg-red-50 p-4 rounded-xl border-l-4 border-red-400">
                <div class="image-container mb-3">
                  <img src="assets/lessons/tsunami/feel.jpg" alt="Feel Earthquake" class="w-full rounded-xl shadow-sm" />
                </div>
                <p class="font-semibold text-red-900 mb-2">
                  <ion-icon name="hand-left-outline" class="align-middle text-xl"></ion-icon>
                  FEEL
                </p>
                <p class="text-sm mb-2">Strong local earthquakes may cause tsunamis.</p>
                <p class="text-sm font-semibold">FEEL the ground shaking severely? Drop, Cover, Hold On until the shaking stops then RUN to high ground.</p>
              </div>

              <div class="bg-orange-50 p-4 rounded-xl border-l-4 border-orange-400">
                <div class="image-container mb-3">
                  <img src="assets/lessons/tsunami/see.jpg" alt="See Water Recede" class="w-full rounded-xl shadow-sm" />
                </div>
                <p class="font-semibold text-orange-900 mb-2">
                  <ion-icon name="eye-outline" class="align-middle text-xl"></ion-icon>
                  SEE
                </p>
                <p class="text-sm mb-2">As a tsunami approaches shorelines, the ocean may pull back from the coastline significantly, exposing the ocean floor, reefs and fish.</p>
                <p class="text-sm font-semibold">SEE an unusual disappearance of water? RUN to high ground.</p>
              </div>

              <div class="bg-yellow-50 p-4 rounded-xl border-l-4 border-yellow-400">
                <div class="image-container mb-3">
                  <img src="assets/lessons/tsunami/hear.jpg" alt="Hear the Roar" class="w-full rounded-xl shadow-sm" />
                </div>
                <p class="font-semibold text-yellow-900 mb-2">
                  <ion-icon name="volume-high-outline" class="align-middle text-xl"></ion-icon>
                  HEAR
                </p>
                <p class="text-sm mb-2">A roar like an oncoming train or plane may be heard as a tsunami rushes toward the shore.</p>
                <p class="text-sm font-semibold">HEAR the roar? RUN to high ground.</p>
              </div>

              <div class="bg-green-50 p-4 rounded-xl border-l-4 border-green-400">
                <p class="font-semibold text-green-900 mb-2">
                  <ion-icon name="walk-outline" class="align-middle text-xl"></ion-icon>
                  RUN
                </p>
                <ul class="text-sm space-y-2">
                  <li class="flex items-start gap-2">
                    <ion-icon name="arrow-forward" class="text-green-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span>RUN to high ground if you experience any one of these natural signs.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="arrow-forward" class="text-green-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span>DO NOT wait for official evacuation orders. Authorities may not have enough time to issue an official warning.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="arrow-forward" class="text-green-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span>Immediately leave low-lying coastal areas e.g. beaches, and head inland or to higher ground.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="arrow-forward" class="text-green-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span>DO NOT try to surf the tsunami or go down to the beach to watch the wave come in.</span>
                  </li>
                </ul>
              </div>
            </div>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="time-outline" class="text-xl"></ion-icon>
              Before a Tsunami
            </h4>
            <ul class="space-y-2 text-gray-700 text-sm">
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Find out if your home, school, workplace or other frequently visited locations are in tsunami hazard areas.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Contact your municipality to know the risks, evacuation and alerting system in your community.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Make a personalized preparedness emergency kit. Families should be prepared to be self-sustaining for at least three days.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Review evacuation plans with household members. Plan evacuation routes to areas 30 metres above sea level or 3 kilometres inland.</span>
              </li>
            </ul>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="alert-circle-outline" class="text-xl"></ion-icon>
              During a Tsunami
            </h4>
            <ul class="space-y-2 text-gray-700 text-sm">
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>If you feel an earthquake, drop, cover and hold.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Following an earthquake, move quickly to higher ground away from the coast.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>A tsunami is a series of waves that can continue for hours. Do not assume that after one wave, the danger is over.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>If already at sea, follow maritime authorities to a safe offshore depth and avoid harbors under warning. If in a harbor, leave your boat and move to high ground; do not delay evacuation to save a boat.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Watching a tsunami could put you in grave danger. If you can see the wave, you are too close to escape it.</span>
              </li>
            </ul>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="shield-checkmark-outline" class="text-xl"></ion-icon>
              After a Tsunami
            </h4>
            <ul class="space-y-2 text-gray-700 text-sm mb-8">
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Continue to take precautions and listen to and follow directions from local authorities.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Be prepared for aftershocks, which could generate another tsunami.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Return home only after local officials tell you it is safe.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Stay out of any building that has water around it. Tsunami force can cause floors to crack or walls to collapse.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Do not light matches or turn on lights or appliances until you are sure there are no gas leaks.</span>
              </li>
            </ul>
          </div>
        `
      }
    },
    {
      id: 2,
      icon: 'thunderstorm-outline',
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      borderColor: '#a78bfa',
      title: 'Typhoon',
      emoji: '🌀',
      subtitle: 'Learn about typhoon classification and safety protocols',
      textColor: '#5b21b6',
      iconGradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
      borderGradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
      content: {
        htmlContent: `
          <div class="space-y-4 text-gray-700 leading-relaxed">
            <h3 class="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <ion-icon name="information-circle-outline" class="text-2xl"></ion-icon>
              What Is A Typhoon?
            </h3>
            
            

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="book-outline" class="text-xl"></ion-icon>
              Definition of Terms:
            </h4>
            <p class="bg-purple-50 p-4 rounded-xl border-l-4 border-purple-400">
              <strong class="text-purple-900">Typhoon</strong> - A typhoon (also called a hurricane or cyclone in other parts of the world) is a huge, powerful storm that forms over warm ocean waters, typically near the equator. PAGASA classifies a typhoon as a tropical cyclone with maximum sustained winds of 118–184 km/h (64–99 knots). Stronger systems are classified as super typhoons. A tropical cyclone with the maximum wind of less than 34 knots is called a tropical depression.
            </p>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="help-circle-outline" class="text-xl"></ion-icon>
              Causes:
            </h4>
            <p class="bg-blue-50 p-4 rounded-xl">
              The cause of a typhoon is the combination of warm ocean waters (at least 26–27°C) and atmospheric conditions that allow moist air to rise and remain warmer than its surroundings, creating instability. This leads to cyclonic circulation driven by the Earth's rotation and centrifugal force, resulting in low pressure and strong winds.
            </p>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="speedometer-outline" class="text-xl"></ion-icon>
              Classification:
            </h4>

            <div class="image-container mb-4">
              <img src="assets/lessons/typhoon/classification.jpg" alt="Typhoon Classification" class="w-full rounded-2xl shadow-md" />
            </div>

            <div class="space-y-3">
              <div class="bg-linear-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
                <p class="font-semibold text-green-900 mb-1">
                  <ion-icon name="leaf-outline" class="align-middle"></ion-icon>
                  TROPICAL DEPRESSION (TD)
                </p>
                <p class="text-sm">Maximum sustained winds of up to 62 kph or less than 34 knots.</p>
              </div>

              <div class="bg-linear-to-r from-yellow-50 to-amber-50 p-4 rounded-xl">
                <p class="font-semibold text-yellow-900 mb-1">
                  <ion-icon name="partly-sunny-outline" class="align-middle"></ion-icon>
                  TROPICAL STORM (TS)
                </p>
                <p class="text-sm">Maximum wind speed of 62 to 88 kph or 34-47 knots.</p>
              </div>

              <div class="bg-linear-to-r from-orange-50 to-red-50 p-4 rounded-xl">
                <p class="font-semibold text-orange-900 mb-1">
                  <ion-icon name="rainy-outline" class="align-middle"></ion-icon>
                  SEVERE TROPICAL STORM (STS)
                </p>
                <p class="text-sm">Maximum wind speed of 87 to 117 kph or 48-63 knots.</p>
              </div>

              <div class="bg-linear-to-r from-red-50 to-pink-50 p-4 rounded-xl">
                <p class="font-semibold text-red-900 mb-1">
                  <ion-icon name="thunderstorm-outline" class="align-middle"></ion-icon>
                  TYPHOON (TY)
                </p>
                <p class="text-sm">Maximum wind speed of 118 to 184 kph or 64-99 knots.</p>
              </div>

              <div class="bg-linear-to-r from-purple-50 to-violet-50 p-4 rounded-xl">
                <p class="font-semibold text-purple-900 mb-1">
                  <ion-icon name="flash-outline" class="align-middle"></ion-icon>
                  SUPER TYPHOON (STY)
                </p>
                <p class="text-sm">Maximum wind speed exceeding 185 kph or more than 100 knots.</p>
              </div>
            </div>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="construct-outline" class="text-xl"></ion-icon>
              How to Prepare for a Typhoon?
            </h4>
            <ul class="space-y-2 text-gray-700 text-sm">
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Talk to your family about typhoons - Spend time together talking about typhoons, why they occur and explain the potential dangers they pose.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Practice your safety plan - Choose the safest shelter for all family members. Prepare an "emergency kit".</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Know your risk - Understand specific typhoon risks in your community.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Trim trees - Regularly trim trees and remove dead branches to reduce the risk of them falling during a storm.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Reinforce your home - Consider installing storm shutters or boarding up windows.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Keep documents safe - Store any important papers elevated above any potential flood lines.</span>
              </li>
            </ul>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="alert-circle-outline" class="text-xl"></ion-icon>
              What to Do During a Typhoon
            </h4>
            <ul class="space-y-2 text-gray-700 text-sm">
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Listen to local authorities - Tune into your local news or radio station for weather updates.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Seek shelter immediately - If a storm is approaching, get inside as soon as possible.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Avoid using electrical appliances - Unplug electrical devices to protect them from power surges.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Stay indoors and away from windows - Do not venture outside until the storm has passed.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Do not let your child leave the safe area - Supervise closely and remind your child not to go outside.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Secure your home - If you need to evacuate, unplug appliances and turn off electricity, gas, and water supplies.</span>
              </li>
            </ul>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="shield-checkmark-outline" class="text-xl"></ion-icon>
              What to Do After a Typhoon
            </h4>
            <ul class="space-y-2 text-gray-700 text-sm">
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Listen for updates - Stay tuned to local authorities for updates and only return home when it is declared safe.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Clean up safely - Check your home and appliances, especially electrical devices, before use.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Keep food and water safe - After a typhoon, food and water sources might be contaminated.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Look after your family's health - Ensure that your family practices good hygiene by washing hands frequently.</span>
              </li>
            </ul>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="heart-outline" class="text-xl"></ion-icon>
              Comforting Your Children After a Typhoon
            </h4>
            <ul class="space-y-2 text-gray-700 text-sm mb-8">
              <li class="flex items-start gap-2">
                <ion-icon name="chatbubbles-outline" class="text-purple-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Start the conversation and keep it open - Make sure you provide your child with opportunities to talk about how the typhoon made them feel.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="shield-outline" class="text-purple-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Provide reassurance - Let them know that the flood and its aftermath are not permanent.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="fitness-outline" class="text-purple-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Practice calming exercises together - Deep belly breathing is very helpful.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="calendar-outline" class="text-purple-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Try to maintain some kind of routine - Going to bed or eating at the same time will help your child feel more connected.</span>
              </li>
            </ul>
          </div>
        `
      }
    },
    {
      id: 3,
      icon: 'rainy-outline',
      color: '#3b82f6',
      bgColor: '#dbeafe',
      borderColor: '#60a5fa',
      title: 'Flood',
      emoji: '💧',
      subtitle: 'Learn about flood types, causes, and emergency response',
      textColor: '#1e3a8a',
      iconGradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
      borderGradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
      content: {
        htmlContent: `
          <div class="space-y-4 text-gray-700 leading-relaxed">
            <h3 class="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <ion-icon name="information-circle-outline" class="text-2xl"></ion-icon>
              What Is A Flood?
            </h3>
            
            

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="book-outline" class="text-xl"></ion-icon>
              Definition of Terms:
            </h4>
            <p class="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-400">
              <strong class="text-blue-900">Flood</strong> - Floods occur when normally dry land becomes submerged by water due to causes like heavy rainfall, river overflow, tsunamis, or hurricanes. Among floods, flash floods are the most dangerous because they happen rapidly, often within minutes of intense rainfall exceeding the ground's absorption capacity, causing swift and destructive water flows.
            </p>

            <div class="image-container">
              <img src="assets/lessons/flood/flood-overview.jpg" alt="Flood Overview" class="w-full rounded-2xl shadow-md" />
            </div>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="help-circle-outline" class="text-xl"></ion-icon>
              Causes:
            </h4>

            <div class="image-container mb-4">
              <img src="assets/lessons/flood/causes.jpg" alt="Flood Causes" class="w-full rounded-2xl shadow-md" />
            </div>

            <div class="space-y-4">
              <div class="bg-linear-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
                <p class="font-semibold text-green-900 mb-2">
                  <ion-icon name="leaf-outline" class="align-middle"></ion-icon>
                  Natural Causes:
                </p>
                <ul class="text-sm space-y-2">
                  <li class="flex items-start gap-2">
                    <ion-icon name="water-outline" class="text-green-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span>Intense and prolonged rainfall</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="water-outline" class="text-green-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span>Unusually high coastal and estuarine waters from storm surges and tsunamis</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="water-outline" class="text-green-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span>Seismic activities such as earthquakes</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="water-outline" class="text-green-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span>High tides coinciding with heavy rainfall</span>
                  </li>
                </ul>
              </div>

              <div class="bg-linear-to-r from-orange-50 to-red-50 p-4 rounded-xl">
                <p class="font-semibold text-orange-900 mb-2">
                  <ion-icon name="build-outline" class="align-middle"></ion-icon>
                  Artificial Causes:
                </p>
                <ul class="text-sm space-y-2">
                  <li class="flex items-start gap-2">
                    <ion-icon name="alert-circle-outline" class="text-orange-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span>Blasting on hillsides leading to accidental damming of rivers</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="alert-circle-outline" class="text-orange-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span>Construction or failure of hydraulic structures</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="alert-circle-outline" class="text-orange-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span>Deforestation and denudation of watersheds</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="alert-circle-outline" class="text-orange-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span>Clogging of sewage systems due to excessive human waste</span>
                  </li>
                </ul>
              </div>
            </div>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="layers-outline" class="text-xl"></ion-icon>
              Types of Floods:
            </h4>

            <div class="space-y-3">
              <div class="bg-linear-to-r from-blue-50 to-cyan-50 p-4 rounded-xl">
                <p class="font-semibold text-blue-900 mb-1">
                  <ion-icon name="water-outline" class="align-middle"></ion-icon>
                  Minor Flooding
                </p>
                <p class="text-sm">Inundation may or may not be due to overbanking; floodwaters are usually shallow, confined to flood plains, and may result from excessive runoff in low-lying areas and depressions.</p>
              </div>

              <div class="bg-linear-to-r from-indigo-50 to-purple-50 p-4 rounded-xl">
                <p class="font-semibold text-indigo-900 mb-1">
                  <ion-icon name="water-outline" class="align-middle"></ion-icon>
                  Major Flooding
                </p>
                <p class="text-sm">Caused by overflowing rivers and lakes, breaks in dams, levees, or other structures; floodwaters are deep, cover wide areas, and often have highly perceptible currents.</p>
              </div>

              <div class="bg-linear-to-r from-red-50 to-orange-50 p-4 rounded-xl">
                <p class="font-semibold text-red-900 mb-1">
                  <ion-icon name="flash-outline" class="align-middle"></ion-icon>
                  Flash Flood
                </p>
                <p class="text-sm">Develops rapidly within six hours of intense rainfall, especially in mountainous terrain; caused by rapid water concentration resulting in swift and dangerous flooding.</p>
              </div>
            </div>

            <div class="image-container mt-4">
              <img src="assets/lessons/flood/flash-flood.jpg" alt="Flash Flood" class="w-full rounded-2xl shadow-md" />
            </div>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="time-outline" class="text-xl"></ion-icon>
              Before a Flood
            </h4>
            <ul class="space-y-2 text-gray-700 text-sm">
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Find out what your flood risk is.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Avoid building in a floodprone area unless you elevate and reinforce your home.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Install "check valves" in sewer traps to prevent floodwater from backing up.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Purchase flood insurance for your home, business or rental.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Know your evacuation zone and make an emergency plan.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Register to receive emergency alerts.</span>
              </li>
            </ul>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="alert-circle-outline" class="text-xl"></ion-icon>
              During a Flood
            </h4>
            <ul class="space-y-2 text-gray-700 text-sm">
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Don't panic. Know your evacuation zone and routes.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Tune in to local media for flood watches and warnings.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Heed warnings from officials and evacuate when orders are given.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Do not walk through moving water. Six inches of moving water can make you fall.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Do not drive into flooded areas. Six inches of water will reach the bottom of most passenger cars.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Follow local instructions for utilities. Never touch electrical equipment while wet or standing in water; evacuate if unsafe.</span>
              </li>
            </ul>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="shield-checkmark-outline" class="text-xl"></ion-icon>
              After a Flood
            </h4>
            <ul class="space-y-2 text-gray-700 text-sm mb-8">
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Use caution when returning home. Review the returning home checklist.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Stay tuned to local news for updates on flooded areas and road closures.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Avoid flooded areas and standing water. Water may be contaminated or electrically charged.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Watch for critters such as snakes, raccoons, and insects that may have moved into your home.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Document the damage. Photograph and list all damaged or lost items.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Remove wet contents immediately to prevent mold. Clean and disinfect everything that got wet.</span>
              </li>
            </ul>
          </div>
        `
      }
    },
    {
      id: 4,
      icon: 'warning-outline',
      color: '#eab308',
      bgColor: '#fef9c3',
      borderColor: '#facc15',
      title: 'Landslide',
      emoji: '⚠️',
      subtitle: 'Learn about landslide warning signs and evacuation',
      textColor: '#92400e',
      iconGradient: 'linear-gradient(135deg, #eab308, #facc15)',
      borderGradient: 'linear-gradient(135deg, #eab308, #facc15)',
      content: {
        htmlContent: `
          <div class="space-y-4 text-gray-700 leading-relaxed">
            <h3 class="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <ion-icon name="information-circle-outline" class="text-2xl"></ion-icon>
              What Is A Landslide?
            </h3>
            
            

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="book-outline" class="text-xl"></ion-icon>
              Definition of Terms:
            </h4>
            <p class="bg-yellow-50 p-4 rounded-xl border-l-4 border-yellow-400">
              <strong class="text-yellow-900">Landslide</strong> - A landslide is the mass movement of rock, soil, and debris down a slope due to gravity. It occurs when the driving force is greater than the resisting force. It is a natural process that occurs in steep slopes. The movement may range from very slow to rapid.
            </p>

            <h4 class="text-md font-semibold text-gray-800 mt-6">Landslide materials may include:</h4>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-amber-50 p-3 rounded-xl text-center">
                <ion-icon name="cube-outline" class="text-3xl text-amber-600 mb-1"></ion-icon>
                <p class="text-sm font-semibold">Soil</p>
              </div>
              <div class="bg-amber-50 p-3 rounded-xl text-center">
                <ion-icon name="trash-outline" class="text-3xl text-amber-600 mb-1"></ion-icon>
                <p class="text-sm font-semibold">Debris</p>
              </div>
              <div class="bg-amber-50 p-3 rounded-xl text-center">
                <ion-icon name="diamond-outline" class="text-3xl text-amber-600 mb-1"></ion-icon>
                <p class="text-sm font-semibold">Rock</p>
              </div>
              <div class="bg-amber-50 p-3 rounded-xl text-center">
                <ion-icon name="golf-outline" class="text-3xl text-amber-600 mb-1"></ion-icon>
                <p class="text-sm font-semibold">Garbage</p>
              </div>
            </div>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="help-circle-outline" class="text-xl"></ion-icon>
              Causes:
            </h4>

            <div class="space-y-4">
              <div class="bg-linear-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
                <p class="font-semibold text-green-900 mb-2">
                  <ion-icon name="leaf-outline" class="align-middle"></ion-icon>
                  Natural Triggers:
                </p>
                <ul class="text-sm space-y-2">
                  <li class="flex items-start gap-2">
                    <ion-icon name="rainy-outline" class="text-green-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span>Intense rainfall can cause flooding and landslides by rapidly saturating soil</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="partly-sunny-outline" class="text-green-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span>Weathering of rocks can lead to weaker slopes</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="pulse-outline" class="text-green-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span>Ground vibrations created during earthquakes may trigger landslides</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="flame-outline" class="text-green-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span>Volcanic activity can produce landslides due to debris flows</span>
                  </li>
                </ul>
              </div>

              <div class="bg-linear-to-r from-orange-50 to-red-50 p-4 rounded-xl">
                <p class="font-semibold text-orange-900 mb-2">
                  <ion-icon name="build-outline" class="align-middle"></ion-icon>
                  Man-made Triggers:
                </p>
                <ul class="text-sm space-y-2">
                  <li class="flex items-start gap-2">
                    <ion-icon name="cut-outline" class="text-orange-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span>Deforestation, blasting, and construction activities can destabilize soil and slopes</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="construct-outline" class="text-orange-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span>Poor management or failure of hydraulic structures (dams, dikes, levees)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="business-outline" class="text-orange-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span>Land-use changes, such as urbanization and improper waste disposal</span>
                  </li>
                </ul>
              </div>
            </div>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="git-network-outline" class="text-xl"></ion-icon>
              Movement of Landslides:
            </h4>

            <div class="space-y-3">
              <div class="bg-gray-50 p-3 rounded-xl">
                <p class="font-semibold text-gray-900 mb-2">Fall</p>
                <div class="image-container">
                  <img src="assets/lessons/landslide/fall.jpg" alt="Fall" class="w-full rounded-xl shadow-sm" />
                </div>
              </div>

              <div class="bg-gray-50 p-3 rounded-xl">
                <p class="font-semibold text-gray-900 mb-2">Topple</p>
                <div class="image-container">
                  <img src="assets/lessons/landslide/topple.jpg" alt="Topple" class="w-full rounded-xl shadow-sm" />
                </div>
              </div>

              <div class="bg-gray-50 p-3 rounded-xl">
                <p class="font-semibold text-gray-900 mb-2">Slide</p>
                <div class="image-container">
                  <img src="assets/lessons/landslide/slide.jpg" alt="Slide" class="w-full rounded-xl shadow-sm" />
                </div>
              </div>

              <div class="bg-gray-50 p-3 rounded-xl">
                <p class="font-semibold text-gray-900 mb-2">Spread</p>
                <div class="image-container">
                  <img src="assets/lessons/landslide/spread.jpg" alt="Spread" class="w-full rounded-xl shadow-sm" />
                </div>
              </div>

              <div class="bg-gray-50 p-3 rounded-xl">
                <p class="font-semibold text-gray-900 mb-2">Flow</p>
                <div class="image-container">
                  <img src="assets/lessons/landslide/flow.jpg" alt="Flow" class="w-full rounded-xl shadow-sm" />
                </div>
              </div>
            </div>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="time-outline" class="text-xl"></ion-icon>
              Before a Landslide
            </h4>
            <ul class="space-y-2 text-gray-700 text-sm">
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Know Your Area's Risk for Landslides - Learn about your area's risk and history of landslides.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Prepare a Landslide Disaster Plan - Have an evacuation plan that you've practiced with your family.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Have an emergency preparedness kit ready including first aid kit, flashlights, batteries, snacks, and water.</span>
              </li>
            </ul>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="alert-circle-outline" class="text-xl"></ion-icon>
              During a Landslide
            </h4>
            <ul class="space-y-2 text-gray-700 text-sm">
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Know the Warning Signs - Watch for changes in landscape like tilting trees or utility poles.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Listen for unusual sounds like cracking or rumbling.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Evacuate Immediately if you suspect a landslide.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Move to the nearest high ground perpendicular to the path.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>If you're stuck in the path of a landslide, move uphill as quickly as possible.</span>
              </li>
            </ul>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="shield-checkmark-outline" class="text-xl"></ion-icon>
              After a Landslide
            </h4>
            <ul class="space-y-2 text-gray-700 text-sm mb-8">
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Wait for the All Clear - Don't return until authorities tell you it's safe.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Listen to emergency broadcasts and pay attention to authorities.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Report any dangers you see such as broken power lines, people in need of rescue, or ruptured gas lines.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>When you can return home, replant the land that's moved as quickly as possible to help prevent erosion.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Always prioritize the needs of the PWD, pregnant, elderly and children as they are the vulnerable group.</span>
              </li>
            </ul>
          </div>
        `
      }
    },
    {
      id: 5,
      icon: 'flame-outline',
      color: '#f43f5e',
      bgColor: '#ffe4e6',
      borderColor: '#fb7185',
      title: 'Volcanic Eruption',
      emoji: '🌋',
      subtitle: 'Learn about volcanic hazards and protection measures',
      textColor: '#be123c',
      iconGradient: 'linear-gradient(135deg, #f43f5e, #fb7185)',
      borderGradient: 'linear-gradient(135deg, #f43f5e, #fb7185)',
      content: {
        htmlContent: `
          <div class="space-y-4 text-gray-700 leading-relaxed">
            <h3 class="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <ion-icon name="information-circle-outline" class="text-2xl"></ion-icon>
              What Is A Volcanic Eruption?
            </h3>
            
            

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="book-outline" class="text-xl"></ion-icon>
              Definition of Terms:
            </h4>
            <p class="bg-rose-50 p-4 rounded-xl border-l-4 border-rose-400">
              <strong class="text-rose-900">Volcano</strong> - A volcano is a vent, hill or mountain from which molten or hot rocks with gaseous material have been ejected. When magma rises and collects in magma chambers, when the pressure is too much and the magma chambers cannot hold it anymore, it shoots out from cracks and crevices called vents, thus resulting in a volcanic eruption.
            </p>

            <div class="image-container">
              <img src="assets/lessons/volcano/ring-of-fire.jpg" alt="Pacific Ring of Fire" class="w-full rounded-2xl shadow-md" />
            </div>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="help-circle-outline" class="text-xl"></ion-icon>
              Causes:
            </h4>
            <p class="bg-blue-50 p-4 rounded-xl">
              Volcanic eruptions are primarily caused by the upward movement of magma due to intense heat and pressure within the Earth's core, which forces molten rock through cracks in the lithosphere until it escapes as lava. Tectonic activities—such as the separation or subduction of Earth's plates—can further generate eruptions by either creating space for magma to rise or mixing seawater, sediment, and molten rock in magma chambers, increasing pressure until release.
            </p>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="alert-outline" class="text-xl"></ion-icon>
              Hazards Related to Volcanic Eruptions:
            </h4>

            <div class="space-y-4">
              <div class="bg-linear-to-r from-red-50 to-orange-50 p-4 rounded-xl">
                <p class="font-semibold text-red-900 mb-2">
                  <ion-icon name="flame-outline" class="align-middle"></ion-icon>
                  Direct Hazards:
                </p>
                <ul class="text-sm space-y-2">
                  <li class="flex items-start gap-2">
                    <ion-icon name="warning-outline" class="text-red-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span><strong>Lava flow:</strong> Molten rock flows down the volcano slopes, destroying everything in its path.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="warning-outline" class="text-red-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span><strong>Tephra fall or ashfall:</strong> Ash and rock fragments ejected high into the air that settle around the volcano.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="warning-outline" class="text-red-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span><strong>Pyroclastic density currents (PDCs):</strong> Fast-moving, hot mixtures of ash, gas, and volcanic debris.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="warning-outline" class="text-red-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span><strong>Lateral blast:</strong> Explosive force directed sideways from the volcano.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="warning-outline" class="text-red-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span><strong>Volcanic gas:</strong> Harmful gases released during eruptions can poison air, water, and soil.</span>
                  </li>
                </ul>
              </div>

              <div class="bg-linear-to-r from-yellow-50 to-amber-50 p-4 rounded-xl">
                <p class="font-semibold text-yellow-900 mb-2">
                  <ion-icon name="alert-circle-outline" class="align-middle"></ion-icon>
                  Indirect Hazards:
                </p>
                <ul class="text-sm space-y-2">
                  <li class="flex items-start gap-2">
                    <ion-icon name="warning-outline" class="text-yellow-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span><strong>Lahar and flooding:</strong> Mudflows made of volcanic ash mixed with water that flow down river valleys.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="warning-outline" class="text-yellow-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span><strong>Debris avalanche and landslide:</strong> Large masses of rock and soil collapse and flow downhill.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="warning-outline" class="text-yellow-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span><strong>Volcanic tsunami:</strong> Large waves generated by volcanic activity under or near water bodies.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <ion-icon name="warning-outline" class="text-yellow-600 flex-shrink-0 mt-0.5"></ion-icon>
                    <span><strong>Ground deformation:</strong> Sinking or cracking of the ground surface caused by volcanic activity.</span>
                  </li>
                </ul>
              </div>
            </div>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="layers-outline" class="text-xl"></ion-icon>
              Types Based on Eruption Style:
            </h4>
            <div class="image-container mb-3">
                  <img src="assets/lessons/volcano/effusive.jpg" alt="Effusive Eruption" class="w-full rounded-xl shadow-sm" />
                </div>

            <div class="space-y-4">
              <div class="bg-linear-to-r from-orange-50 to-red-50 p-4 rounded-xl">
                <p class="font-semibold text-orange-900 mb-2">
                  <ion-icon name="water-outline" class="align-middle"></ion-icon>
                  Effusive Eruption:
                </p>
                <p class="text-sm">Effusive eruptions happen when magma is runny and allows gas to escape easily, causing lava to flow gently and steadily out of the volcano. If the magma is thick and sticky, it can't flow easily and builds up near the vent, forming a lava dome. These eruptions are usually less explosive.</p>
              </div>

              <div class="image-container mb-3">
                  <img src="assets/lessons/volcano/explosive.jpg" alt="Explosive Eruption" class="w-full rounded-xl shadow-sm" />
                </div>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="construct-outline" class="text-xl"></ion-icon>
              Prepare NOW
            </h4>
            <ul class="space-y-2 text-gray-700 text-sm">
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Know your area's risk from volcanic eruption.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Ask local emergency management for evacuation and shelter plans.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Learn about community warning systems by signing up for the Volcano Notification Service (VNS).</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Get necessary supplies including nonperishable foods, water, and cleaning supplies for several days.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Consult your doctor if you have existing respiratory difficulties.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="checkmark-circle" class="text-green-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Keep important documents in a safe place.</span>
              </li>
            </ul>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="alert-circle-outline" class="text-xl"></ion-icon>
              Survive DURING
            </h4>
            <ul class="space-y-2 text-gray-700 text-sm">
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Listen to alerts and follow evacuation orders from local authorities. Evacuate early.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Avoid areas downwind and river valleys downstream of the volcano.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Take temporary shelter from volcanic ash if you have enough supplies. Cover ventilation openings and seal doors and windows.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>If outside, use a well-fitting, certified face mask such as an N95 to protect from falling ash.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Wear long-sleeved shirts and long pants for protection.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="warning" class="text-orange-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Avoid driving in heavy ash fall.</span>
              </li>
            </ul>

            <h4 class="text-md font-semibold text-gray-800 mt-6 flex items-center gap-2">
              <ion-icon name="shield-checkmark-outline" class="text-xl"></ion-icon>
              Be Safe AFTER
            </h4>
            <ul class="space-y-2 text-gray-700 text-sm mb-8">
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Listen to authorities to find out when it is safe to return after an eruption.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Send text messages or use social media to reach out to family and friends.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Avoid driving in heavy ash as it can clog engines and stall vehicles.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Avoid contact with ash if you have any breathing problems.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Do not get on your roof to remove ash unless you have guidance or training. Be very careful as ash makes surfaces slippery.</span>
              </li>
              <li class="flex items-start gap-2">
                <ion-icon name="medical" class="text-blue-500 text-lg flex-shrink-0 mt-0.5"></ion-icon>
                <span>Wear protective clothing and a mask when cleaning up. Children should not help with cleanup efforts.</span>
              </li>
            </ul>
          </div>
        `
      }
    }
  ];

  errorMessage='';
  ngOnInit(){void this.ionViewWillEnter();}
  async ionViewWillEnter(){
    try {const d=await progressData();this.userId=d.user.id;this.lessonsCompleted=d.lessons;this.errorMessage='';}
    catch{this.errorMessage='Could not load your lessons. Check your connection and retry.';}
  }
  selectLesson(lesson: Lesson) {
    this.selectedLesson = lesson;
    this.hasReachedBottom = false;
    document.body.classList.add('modal-open');
  }

  closeLesson() {
    this.selectedLesson = null;
    this.hasReachedBottom = false;
    document.body.classList.remove('modal-open');
  }

  isCompleted(id: number): boolean {
    return this.lessonsCompleted.includes(id);
  }

  onScroll(event: any) {
    if (!this.selectedLesson || this.hasReachedBottom) return;

    const element = event.target;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    if (scrollPercentage >= this.scrollThreshold && !this.isCompleted(this.selectedLesson.id)) {
      this.hasReachedBottom = true;
      this.completeLesson();
    }
  }

  async completeLesson() {
    if (!this.userId || !this.selectedLesson) return;

    const lessonId = this.selectedLesson.id;

    if (!this.lessonsCompleted.includes(lessonId)) {
      const {error}=await db.from('lesson_completions').upsert({user_id:this.userId,lesson_id:lessonId},{onConflict:'user_id,lesson_id',ignoreDuplicates:true});
      if(error){this.errorMessage='Could not save this lesson. Please retry.';this.hasReachedBottom=false;return;}
      this.errorMessage='';
      this.lessonsCompleted=[...new Set([...this.lessonsCompleted,lessonId])];
      // Show completion popup
      this.showCompletionPopup = true;
    }
  }

  closeCompletionPopup() {
    this.showCompletionPopup = false;
    this.closeLesson();
  }
}