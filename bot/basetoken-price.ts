import axios from 'axios';

import config from './config';

let bnbPrice = 0;

// clear bnb price every hour
// TODO: use lock here
setInterval(() => {
  bnbPrice = 0;
}, 3600000);

export async function getBnbPrice(): Promise<number> {
  if (bnbPrice !== 0) {
    return bnbPrice;
  }
  const res = await axios.get(config.bscScanUrl);
  const price = parseFloat(res.data.result.ethusd);
  bnbPrice = price;
  return price;
}
