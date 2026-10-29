import https from 'node:https';

// Curate candidate photos by topic
const photoPool = {
  architecture: [
    'photo-1513694203232-719a280e022f',
    'photo-1486406146926-c627a92ad1ab',
    'photo-1504384308090-c894fdcc538d',
    'photo-1479839672679-a46483c0e7c8',
    'photo-1517581177682-a085bb7ffb15',
    'photo-1533158307587-828f0a76ef46',
    'photo-1513584684374-8bab748fbf90',
    'photo-1487958449943-2429e8be8625',
    'photo-1506157786151-b8491531f063',
    'photo-1494526585095-c41746248156',
    'photo-1503387762-592deb58ef4e',
    'photo-1518780664697-55e3ad937233',
    'photo-1512917774080-9991f1c4c750',
    'photo-1600585154340-be6161a56a0c',
    'photo-1600596542815-ffad4c1539a9',
    'photo-1600607687939-ce8a6c25118c',
    'photo-1541888946425-d0fbb18086f6',
    'photo-1486718448742-163732cd1544',
  ],
  datacenter_hardware: [
    'photo-1518770660439-4636190af475',
    'photo-1550751827-4bd374c3f58b',
    'photo-1526374965328-7f61d4dc18c5',
    'photo-1550745165-9bc0b252726f',
    'photo-1563770660941-20978e870e26',
    'photo-1517420704952-d9f39e95b43e',
    'photo-1581092160607-ee22621dd758',
    'photo-1544197150-b99a580bb7a8',
    'photo-1591488320449-011701bb6704',
    'photo-1562774053-701939374585',
    'photo-1525547719571-a2d4ac8945e2',
    'photo-1558494949-ef010cbdcc31',
    'photo-1544716278-ca5e3f4abd8c',
    'photo-1563986768609-322da13575f3',
    'photo-1519389950473-47ba0277781c',
  ],
  desks_dev: [
    'photo-1507238691740-187a5b1d37b8',
    'photo-1498050108023-c5249f4df085',
    'photo-1461749280684-dccba630e2f6',
    'photo-1515378791036-0648a3ef77b2',
    'photo-1517694712202-14dd9538aa97',
    'photo-1593642632823-8f785ba67e45',
    'photo-1587614382346-4ec70e388b28',
    'photo-1555066931-4365d14bab8c',
    'photo-1527689368864-3a821dbccc34',
    'photo-1510519138111-550da62742a2',
    'photo-1585076641399-5c06d1b3365b',
    'photo-1534972195531-a756b1126f24',
    'photo-1542838132-92c53300491e',
    'photo-1526379095098-d400fd0bf935',
  ],
  photography_urban: [
    'photo-1514565131-fce0801e5785',
    'photo-1509114397022-ed747cca3f65',
    'photo-1519501025264-65ba15a82390',
    'photo-1449824913935-59a10b8d2000',
    'photo-1470071459604-3b5ec3a7fe05',
    'photo-1444703686981-a3abbc4d4fe3',
    'photo-1472214103451-9374bd1c798e',
    'photo-1464822759023-fed622ff2c3b',
    'photo-1507525428034-b723cf961d3e',
    'photo-1513694203232-719a280e022f',
    'photo-1518495973542-4542c06a5843',
    'photo-1493976040374-85c8e12f0c0e',
    'photo-1500530855697-b586d89ba3ee',
    'photo-1492691527719-9d1e07e534b4',
    'photo-1478760329108-5c3ed9d495a0',
  ],
  lifestyle_cafes: [
    'photo-1495474472287-4d71bcdd2085',
    'photo-1501339847302-ac426a4a7cbb',
    'photo-1511920170033-f8396924c348',
    'photo-1554118811-1e0d58224f24',
    'photo-1559925393-8be0ec4767c8',
    'photo-1565299624946-b28f40a0ae38',
    'photo-1540420773420-3366772f4999',
    'photo-1567620905732-2d1ec7ab7445',
    'photo-1512621776951-a57141f2eefd',
    'photo-1476224203421-9ac39bcb3327',
    'photo-1509722747041-616f39b57569',
    'photo-1568901346375-23c9450c58cd',
    'photo-1555396273-367ea4eb4db5',
    'photo-1442512595331-e89e73853f31',
    'photo-1514432324607-a09d9b4aefdd',
  ],
  books_campus: [
    'photo-1497633762265-9d179a990aa6',
    'photo-1524995997946-a1c2e315a42f',
    'photo-1457369804613-52c61a468e7d',
    'photo-1491841550275-ad7854e35ca6',
    'photo-1523240795612-9a054b0db644',
    'photo-1522202176988-66273c2fd55f',
    'photo-1503676260728-1c00da094a0b',
    'photo-1488646953014-85cb44e25828',
    'photo-1469854523086-cc02fe5d8800',
    'photo-1532012164546-f432f2e3777f',
    'photo-1495640388908-05fa85288e61',
    'photo-1516979187457-637abb4f9353',
    'photo-1477281765962-ef34e8bb0967',
  ],
  art_creative_pets: [
    'photo-1618005182384-a83a8bd57fbe',
    'photo-1514888286974-6c03e2ca1dba',
    'photo-1543466835-00a7907e9de1',
    'photo-1537151625747-768eb6cf92b2',
    'photo-1518791841217-8f162f1e1131',
    'photo-1534447677768-be436bb09401',
    'photo-1550684848-fac1c5b4e853',
    'photo-1579783900882-c0d3dad7b119',
    'photo-1513364776144-60967b0f800f',
    'photo-1511671782779-c97d3d27a1d4',
    'photo-1510915361894-db8b60106cb1',
    'photo-1541701494587-cb58502866ab',
    'photo-1578301978693-85fa9c0320b9',
    'photo-1507676184212-d03ab07a01bf',
    'photo-1453728013993-6d66e9c9123a',
    'photo-1518020382113-a7e8fc38eac9',
  ],
};

const allIds = [...new Set(Object.values(photoPool).flat())];

function checkImage(id) {
  const url = `https://images.unsplash.com/${id}?w=1200&auto=format&fit=crop&q=80`;
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
      resolve({
        id,
        url,
        status: res.statusCode,
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
  console.log(`Checking ${allIds.length} candidate Unsplash photos across all categories...`);
  const results = [];
  for (let i = 0; i < allIds.length; i += 12) {
    const batch = allIds.slice(i, i + 12);
    const batchRes = await Promise.all(batch.map(checkImage));
    results.push(...batchRes);
  }

  const okList = results.filter(r => r.ok);
  const failList = results.filter(r => !r.ok);

  console.log(`OK: ${okList.length} / ${allIds.length}`);
  if (failList.length > 0) {
    console.log(`Failed (${failList.length}):`, failList.map(f => f.id));
  } else {
    console.log('All candidate photos are 100% verified HTTP 200!');
  }
}

run();
