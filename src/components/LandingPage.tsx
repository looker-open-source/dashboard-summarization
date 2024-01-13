import React from 'react'

function BardLogo(){
    const search = false
    const SVG = () => (
      <svg width="100%" height="100%" viewBox={search ? "10 -100 1000 2000" : "0 -800 700 3000"} fill="none">
        <path className="bard"
          d="M515.09 725.824L472.006 824.503C455.444 862.434 402.954 862.434 386.393 824.503L343.308 725.824C304.966 638.006 235.953 568.104 149.868 529.892L31.2779 477.251C-6.42601 460.515 -6.42594 405.665 31.2779 388.929L146.164 337.932C234.463 298.737 304.714 226.244 342.401 135.431L386.044 30.2693C402.239 -8.75637 456.159 -8.75646 472.355 30.2692L515.998 135.432C553.685 226.244 623.935 298.737 712.234 337.932L827.121 388.929C864.825 405.665 864.825 460.515 827.121 477.251L708.53 529.892C622.446 568.104 553.433 638.006 515.09 725.824Z" fill="url(#paint0_radial_2525_777)"/>
        <path d="M915.485 1036.98L903.367 1064.75C894.499 1085.08 866.349 1085.08 857.481 1064.75L845.364 1036.98C823.765 987.465 784.862 948.042 736.318 926.475L698.987 909.889C678.802 900.921 678.802 871.578 698.987 862.61L734.231 846.951C784.023 824.829 823.623 783.947 844.851 732.75L857.294 702.741C865.966 681.826 894.882 681.826 903.554 702.741L915.997 732.75C937.225 783.947 976.826 824.829 1026.62 846.951L1061.86 862.61C1082.05 871.578 1082.05 900.921 1061.86 909.889L1024.53 926.475C975.987 948.042 937.083 987.465 915.485 1036.98Z" fill="url(#paint1_radial_2525_777)"/>
        <defs>
        <radialGradient id="paint0_radial_2525_777" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(670.447 474.006) rotate(78.858) scale(665.5 665.824)">
        <stop stopColor="#1BA1E3"/>
        <stop offset="0.0001" stopColor="#1BA1E3"/>
        <stop offset="0.300221" stopColor="#5489D6"/>
        <stop offset="0.545524" stopColor="#9B72CB"/>
        <stop offset="0.825372" stopColor="#D96570"/>
        <stop offset="1" stopColor="#F49C46"/>
        <animate attributeName="r" dur="5000ms" from="0" to="1" repeatCount="indefinite" />
        </radialGradient>
        <radialGradient id="paint1_radial_2525_777" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(670.447 474.006) rotate(78.858) scale(665.5 665.824)">
        <stop stopColor="#1BA1E3"/>
        <stop offset="0.0001" stopColor="#1BA1E3"/>
        <stop offset="0.300221" stopColor="#5489D6"/>
        <stop offset="0.545524" stopColor="#9B72CB"/>
        <stop offset="0.825372" stopColor="#D96570"/>
        <stop offset="1" stopColor="#F49C46"/>
        <animate attributeName="r" dur="5000ms" from="0" to="1" repeatCount="indefinite" />
        </radialGradient>
        </defs>
      </svg>
    )
    return (
      <>
        {SVG()}
      </>
    )
}

function LandingPage (){
  const docs = [
    {
      title: 'No Code Prompt Tuning',
      model: 'Vertex AI Generative AI Studio',
      description:
        'No code prompt tuning of foundational model with generated Python code for engineer hand off.',
      doc: 'https://cloud.google.com/vertex-ai/docs/generative-ai/learn/generative-ai-studio',
    },
    {
      title: 'Generative Summarization',
      model: 'gemini-pro',
      description:
        'Multi-modal model by Google. Used to generate summaries for each dashboard query and stream the results to the extension',
      doc: 'https://cloud.google.com/vertex-ai/docs/generative-ai/start/quickstarts/quickstart-multimodal',
    },
  ]

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          zIndex: 1,
          overflowY: 'scroll'
        }}
      >
          {docs.map((doc, index) => {
            return (
              <a
                href={doc.doc}
                style={{ textDecoration: 'none' }}
                target="_blank"
                rel="noreferrer"
                key={index}
              >
                <div
                  style={{
                    cursor: 'pointer',
                    width: '100%',
                    height: '18vh',
                    marginTop: '2rem',
                    borderRadius: '5px',
                    display: 'flex',
                    flexDirection: 'row',
                  }}
                >
                  <div
                    style={{
                      width: '20%',
                      height: '100%',
                      borderRight: '1px solid #ccc',
                    }}
                  >
                    <img
                      height="50%"
                      width="70%"
                      src={
                        index === 0
                          ? 'https://lh3.googleusercontent.com/-1brN-k2sapOWO4gfdJKGEH8kZbfFjrzEMjNs1dl4u64PBH-yxVmB5vG2aHDatRudSByL3lwViUg1w'
                          : 'https://lh3.googleusercontent.com/-1brN-k2sapOWO4gfdJKGEH8kZbfFjrzEMjNs1dl4u64PBH-yxVmB5vG2aHDatRudSByL3lwViUg1w'
                      }
                    />
                  </div>
                  <div
                    style={{
                      paddingTop: '1rem',
                      paddingLeft: '1rem',
                      width: '80%',
                      height: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <span
                      style={{
                        height: 'auto',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        fontFamily: 'sans-serif',
                        letterSpacing: '-0.1rem',
                        display: 'block',
                        textAlign: 'left',
                        width: '100%',
                        color: 'black',
                        border: 'none',
                      }}
                    >
                      {doc.title}
                    </span>
                    <p
                      style={{ color: 'rgb(26, 115, 232)', fontSize: '0.8rem',margin:0 }}
                    >
                      {doc.model}
                    </p>
                    <p
                      style={{
                        fontSize: '0.8rem',
                        width: 'auto',
                        height: 'auto',
                        color: 'black',
                        opacity: 0.8,
                      }}
                    >
                      {doc.description}
                    </p>
                  </div>
                </div>
              </a>
            )
          })}
      </div>
    </>
  )
}

export { BardLogo, LandingPage};