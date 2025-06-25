import React from "react";

function AIPageRenderer({ html }) {
  if (!html || typeof html !== "string") {
    return <div className="p-4 text-red-500">Error: Invalid HTML content</div>;
  }

  // Temporary portfolio template
  const portfolioTemplate = `
<body class="bg-white text-gray-900">
  <header class="bg-gray-50 p-4 text-center">
    <h1 class="text-3xl font-bold mb-4">My Software Engineer Portfolio</h1>
    <p class="mb-4">Welcome to my portfolio. This is a simple portfolio website built with HTML and Tailwind CSS.</p>
  </header>

  <main class="max-w-lg mx-auto p-4 flex justify-center">
    <section class="bg-white rounded-2xl p-6 flex items-center">
      <div class="w-1/2 mr-4">
        <h2 class="text-xl font-bold mb-2">My Skills</h2>
        <ul class="list-disc ml-4">
          <li class="mb-2">JavaScript</li>
          <li class="mb-2">React</li>
          <li class="mb-2">Node.js</li>
          <li class="mb-2">Python</li>
          <li class="mb-2">SQL</li>
        </ul>
      </div>
      <div class="w-1/2">
        <h2 class="text-xl font-bold mb-2">My Projects</h2>
        <ul class="list-disc ml-4">
          <li class="mb-2">Project 1</li>
          <li class="mb-2">Project 2</li>
          <li class="mb-2">Project 3</li>
          <li class="mb-2">Project 4</li>
          <li class="mb-2">Project 5</li>
        </ul>
      </div>
    </section>

    <section class="bg-white rounded-2xl p-6 flex items-center">
      <div class="w-1/2 mr-4">
        <h2 class="text-xl font-bold mb-2">My Experience</h2>
        <ul class="list-disc ml-4">
          <li class="mb-2">Company 1</li>
          <li class="mb-2">Company 2</li>
          <li class="mb-2">Company 3</li>
          <li class="mb-2">Company 4</li>
          <li class="mb-2">Company 5</li>
        </ul>
      </div>
    </section>
  </main>

  <footer class="bg-gray-100 p-4 text-center">
    <p class="mb-4">Copyright © 2023 My Portfolio. All rights reserved.</p>
  </footer>
</body>
  `;

  return (
   
    <div class="bg-red-100 p-6 rounded-lg shadow-md"> <h2 class="text-white font-bold\">Daniel Maslia's Portfolio</h2></div>// <div className="w-full min-h-screen">
    //   <div className="max-w-10xl mx-auto">
    //     <div dangerouslySetInnerHTML={{ __html: portfolioTemplate }} />
    //   </div>
    // </div>
  );
}

export default AIPageRenderer;
