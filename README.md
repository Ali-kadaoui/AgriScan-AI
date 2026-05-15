<div align="center">
  <img src="https://img.icons8.com/fluency/96/000000/leaf.png" width="80" alt="AgriScan Logo"/>
  <h1>AgriScan AI (Zr3 M3ana)</h1>
  <p><b>Smart Farming Assistant powered by Vision AI & Large Language Models</b></p>

  <p>
    <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
    <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
    <img src="https://img.shields.io/badge/Groq_API-F55036?style=for-the-badge&logo=groq&logoColor=white" alt="Groq" />
  </p>
</div>

<hr>

<h2>About The Project</h2>

<p>Modern agriculture faces growing challenges with the rapid spread of plant pathologies. Late detection leads to significant crop losses and the overuse of chemical treatments. <b>AgriScan AI (Zr3 M3ana)</b> is a mobile-first solution built specifically for farmers (with native Moroccan Arabic support) to diagnose plant diseases instantly using smartphone cameras and state-of-the-art AI.</p>

<h3>Key Features</h3>
<ul>
  <li><b>AgriScan (Vision AI):</b> Crop a photo of a sick leaf and instantly receive the plant name, disease condition, confidence score, and step-by-step treatment plans powered by Llama-4-Scout.</li>
  <li><b>AgriBot:</b> A contextual, multilingual virtual assistant (Llama-3.3-Versatile). It automatically knows what plant you just scanned and can chat with you in English, French, or Arabic.</li>
  <li><b>PlantWiki:</b> A built-in global plant database to search for crop requirements (watering, sunlight, soil) and save favorites.</li>
  <li><b>Dynamic Accessibility:</b> Native RTL (Right-to-Left) support for Arabic users, alongside a customizable Dark Mode.</li>
  <li><b>Smart Dashboard:</b> Real-time localized weather data and quick access to recent scans.</li>
</ul>

<hr>

<h2>App Preview</h2>

<p align="center">
  <i>(Click on the images to view them in full size)</i>
</p>

<table align="center">
  <tr>
    <td align="center"><b>Smart Dashboard</b></td>
    <td align="center"><b>AI Crop Scanner</b></td>
    <td align="center"><b>Diagnosis & Treatment</b></td>
  </tr>
  <tr>
    <td><img src="link_to_your_dashboard_image.png" width="220" alt="Dashboard"/></td>
    <td><img src="link_to_your_scan_crop_image.png" width="220" alt="Scanner"/></td>
    <td><img src="link_to_your_results_image.png" width="220" alt="Results"/></td>
  </tr>
  <tr>
    <td align="center"><b>AgriBot Assistant</b></td>
    <td align="center"><b>PlantWiki Library</b></td>
    <td align="center"><b>User Profile & History</b></td>
  </tr>
  <tr>
    <td><img src="link_to_your_agribot_image.png" width="220" alt="AgriBot Chat"/></td>
    <td><img src="link_to_your_wiki_image.png" width="220" alt="Plant Wiki"/></td>
    <td><img src="link_to_your_profile_image.png" width="220" alt="Profile Grid"/></td>
  </tr>
</table>

<hr>

<h2>Architecture & Tech Stack</h2>

<p>AgriScan uses a strictly decoupled Client-Server architecture to separate the user interface from the heavy AI inference logic.</p>

<details>
<summary><b>Click to expand Tech Stack details</b></summary>
<br>
<b>Frontend (Mobile App)</b>
<ul>
  <li><b>Framework:</b> React Native (Expo)</li>
  <li><b>Routing:</b> Expo Router</li>
  <li><b>UI/UX Handling:</b> Dynamic RTL switching, robust Regex parsing to clean AI JSON responses.</li>
</ul>

<b>Backend (REST API)</b>
<ul>
  <li><b>Framework:</b> FastAPI (Python) - Chosen for asynchronous speed.</li>
  <li><b>Image Processing:</b> PIL (Python Imaging Library) for resizing and Base64 encoding.</li>
  <li><b>Database:</b> SQLite with SQLAlchemy ORM (Tables: User, ScanHistory, PlantWiki, UserSavedPlant, ChatMessage).</li>
</ul>

<b>Artificial Intelligence</b>
<ul>
  <li><b>Provider:</b> Groq API (Ultra-fast inference)</li>
  <li><b>Vision Model:</b> Llama-4-Scout (Disease detection and confidence scoring)</li>
  <li><b>LLM Model:</b> Llama-3.3-Versatile (AgriBot conversational engine)</li>
</ul>
</details>

<hr>

<h2>Getting Started (Local Installation)</h2>

<p>To run AgriScan AI on your local machine, you will need to run the backend and frontend simultaneously. Since the mobile app needs to communicate with your computer, ensure both your computer and testing phone are on the same Wi-Fi network.</p>

<blockquote>
  <b>Prerequisites:</b> You must have Python 3.8+, Node.js, npm, and the Expo Go mobile app installed before proceeding.
</blockquote>

<details open>
<summary><b>Phase 1: Backend Setup (FastAPI)</b></summary>
<br>
<p>1. Open your terminal and navigate to the backend folder:</p>
<pre><code>cd Zr3M3ana-bd</code></pre>

<p>2. Create and activate a Python virtual environment:</p>
<pre><code>python -m venv venv
.\venv\Scripts\activate</code></pre>

<p>3. Install all required Python libraries:</p>
<pre><code>pip install fastapi uvicorn sqlalchemy groq pydantic pillow</code></pre>

<p>4. <b>Configure API Keys:</b> Open <code>Zr3M3ana-bd/config.py</code> in your code editor. Locate the API key variables at the top of the file and replace the placeholder strings with your actual keys:</p>
<pre><code>GROQ_API_KEY = "your_real_groq_key_here"
PERENUAL_TOKEN = "your_real_perenual_token_here"</code></pre>

<p>5. <b>Start the Server:</b> Run the server using <code>0.0.0.0</code> so your mobile phone can access it over your local network:</p>
<pre><code>uvicorn main:app --host 0.0.0.0 --port 8000 --reload</code></pre>
</details>

<br>

<details open>
<summary><b>Phase 2: Frontend Setup (React Native / Expo)</b></summary>
<br>
<p>1. Open a <i>second</i> terminal window and navigate to the frontend folder:</p>
<pre><code>cd Zr3M3ana</code></pre>

<p>2. Install the required Node dependencies:</p>
<pre><code>npm install</code></pre>

<p>3. <b>Configure the Network IP Address:</b> Find your computer's local IPv4 address by typing <kbd>ipconfig</kbd> in a Windows terminal (it usually looks like <code>192.168.1.X</code>).</p>
<ul>
  <li>Open <code>Zr3M3ana/api.js</code> and replace the localhost URL with your local IP address (e.g., <code>http://192.168.1.X:8000</code>).</li>
  <li>Open <code>Zr3M3ana/app/(tabs)/index.tsx</code> and update the IP address there to match.</li>
</ul>

<p>4. <b>Start the App:</b></p>
<pre><code>npx expo start</code></pre>
</details>

<br>

<details open>
<summary><b>Phase 3: Running on your Phone</b></summary>
<br>
<p>Once the Expo server is running, a QR code will appear in your frontend terminal window. Scan this QR code with the <b>Expo Go</b> app on your physical smartphone. You can now test the camera, database, and AI scanning features live on your device.</p>
</details>

<hr>

<div align="center">
  <p>Built by Ali Kadaoui at EMSI Marrakesh</p>
</div>
