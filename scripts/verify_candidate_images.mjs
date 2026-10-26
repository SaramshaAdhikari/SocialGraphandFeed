import https from 'node:https';

const candidatePhotoIds = [
  // Architecture & Buildings
  'photo-1513694203232-719a280e022f', // interior monochrome
  'photo-1486406146926-c627a92ad1ab', // glass/steel building
  'photo-1504384308090-c894fdcc538d', // turbine/industrial
  'photo-1479839672679-a46483c0e7c8', // brutalist concrete
  'photo-1517581177682-a085bb7ffb15', // concrete stairs
  'photo-1533158307587-828f0a76ef46', // spiral architecture
  'photo-1513584684374-8bab748fbf90', // modern building facade
  'photo-1487958449943-2429e8be8625', // colorful building geometry
  'photo-1506157786151-b8491531f063', // interior ceiling architecture
  'photo-1494526585095-c41746248156', // modern minimalist home
  'photo-1503387762-592deb58ef4e', // blueprints and architecture drawing
  'photo-1518780664697-55e3ad937233', // house architecture exterior

  // Tech, Electronics, Datacenters
  'photo-1518770660439-4636190af475', // chip microprocessor
  'photo-1550751827-4bd374c3f58b', // server rack cables
  'photo-1526374965328-7f61d4dc18c5', // matrix code terminal
  'photo-1550745165-9bc0b252726f', // retro computers
  'photo-1563770660941-20978e870e26', // fiber optics
  'photo-1517420704952-d9f39e95b43e', // circuit board close-up
  'photo-1531482615713-2afd69097998', // whiteboard coding meeting
  'photo-1581092160607-ee22621dd758', // robotics hardware
  'photo-1581092335397-9583fe92d232', // industrial engineer lab

  // Workspace, Desk, Coding, Laptops
  'photo-1507238691740-187a5b1d37b8', // desk laptop notebook
  'photo-1498050108023-c5249f4df085', // macbook code screen
  'photo-1461749280684-dccba630e2f6', // code on monitor
  'photo-1515378791036-0648a3ef77b2', // laptop workspace
  'photo-1517694712202-14dd9538aa97', // coding laptop desk
  'photo-1593642632823-8f785ba67e45', // clean minimalist desk
  'photo-1587614382346-4ec70e388b28', // keyboard and mouse
  'photo-1555066931-4365d14bab8c', // vs code screen close up
  'photo-1527689368864-3a821dbccc34', // dual monitor home office
  'photo-1618005182384-a83a8bd57fbe', // abstract 3d wave art

  // Urban, Street, Night & Monochrome Photography
  'photo-1514565131-fce0801e5785', // neon rain pavement
  'photo-1509114397022-ed747cca3f65', // neon street night
  'photo-1519501025264-65ba15a82390', // city skyline monochrome
  'photo-1477959858617-67f30bc75b82', // city twilight lights
  'photo-1449824913935-59a10b8d2000', // city street traffic
  'photo-1470071459604-3b5ec3a7fe05', // moody fog landscape
  'photo-1444703686981-a3abbc4d4fe3', // starry night sky
  'photo-1472214103451-9374bd1c798e', // rolling green hills
  'photo-1464822759023-fed622ff2c3b', // mountain peaks
  'photo-1507525428034-b723cf961d3e', // tropical beach ocean

  // Cafes, Coffee, Food & Lifestyle
  'photo-1495474472287-4d71bcdd2085', // coffee latte art
  'photo-1501339847302-ac426a4a7cbb', // cafe interior aesthetic
  'photo-1511920170033-f8396924c348', // espresso cup on wood
  'photo-1554118811-1e0d58224f24', // cozy coffee shop
  'photo-1559925393-8be0ec4767c8', // pastries and bakery
  'photo-1565299624946-b28f40a0ae38', // homemade pizza
  'photo-1540420773420-3366772f4999', // fresh healthy salad bowl
  'photo-1567620905732-2d1ec7ab7445', // stack of pancakes breakfast
  'photo-1512621776951-a57141f2eefd', // salad vegan food
  'photo-1476224203421-9ac39bcb3327', // culinary plate dish

  // Books, Study, Campus Life, Travel
  'photo-1497633762265-9d179a990aa6', // books stacked in library
  'photo-1524995997946-a1c2e315a42f', // library bookshelves
  'photo-1457369804613-52c61a468e7d', // open book on wooden table
  'photo-1491841550275-ad7854e35ca6', // reading journal notebook
  'photo-1523240795612-9a054b0db644', // university students studying
  'photo-1522202176988-66273c2fd55f', // students collaborating around table
  'photo-1503676260728-1c00da094a0b', // backpack traveler on mountain trail
  'photo-1488646953014-85cb44e25828', // travel camera map passport
  'photo-1469854523086-cc02fe5d8800', // road trip camper van on desert road

  // Pets, Outdoors, Hobbies
  'photo-1514888286974-6c03e2ca1dba', // cute cat portrait close-up
  'photo-1543466835-00a7907e9de1', // golden retriever dog in park
  'photo-1537151625747-768eb6cf92b2', // puppy looking at camera
  'photo-1518791841217-8f162f1e1131', // tabby cat lying down
  'photo-1534447677768-be436bb09401', // abstract liquid marble
  'photo-1550684848-fac1c5b4e853', // dark fluid abstract
  'photo-1579783900882-c0d3dad7b119', // oil painting texture
  'photo-1513364776144-60967b0f800f', // paint brush and easel
  'photo-1511671782779-c97d3d27a1d4', // vinyl record player turntable
  'photo-1510915361894-db8b60106cb1', // acoustic guitar on stand
];

function checkImage(id) {
  const url = `https://images.unsplash.com/${id}?w=1200&auto=format&fit=crop&q=80`;
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
      resolve({
        id,
        url,
        status: res.statusCode,
        contentType: res.headers['content-type'],
        ok: res.statusCode >= 200 && res.statusCode < 300,
      });
    });
    req.on('error', () => resolve({ id, url, ok: false, status: 0 }));
    req.setTimeout(4000, () => {
      req.destroy();
      resolve({ id, url, ok: false, status: 408 });
    });
    req.end();
  });
}

async function run() {
  console.log(`Checking ${candidatePhotoIds.length} candidate Unsplash photos...`);
  const results = [];
  // batch in chunks of 10
  for (let i = 0; i < candidatePhotoIds.length; i += 10) {
    const batch = candidatePhotoIds.slice(i, i + 10);
    const batchRes = await Promise.all(batch.map(checkImage));
    results.push(...batchRes);
  }

  const okList = results.filter(r => r.ok);
  const failList = results.filter(r => !r.ok);

  console.log(`OK: ${okList.length} / ${candidatePhotoIds.length}`);
  if (failList.length > 0) {
    console.log(`Failed (${failList.length}):`, failList.map(f => f.id));
  }
}

run();
