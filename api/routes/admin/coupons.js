const router = require('express').Router();
const Coupon = require('../../models/Coupon');
const CouponCode = require('../../models/CouponCode');
const Redemption = require('../../models/Redemption');

// helper to generate random unguessable codes
function genCode(len=12){
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length:len},()=>chars[Math.floor(Math.random()*chars.length)]).join('');
}

/**
 * POST /api/admin/coupons
 * Create a coupon
 */
router.post('/', async (req, res) => {
  const body = req.body || {};
  if (!body.name || !body.type || typeof body.value !== 'number') {
    return res.status(400).json({ ok:false, msg:'name, type, value are required' });
  }
  const doc = await Coupon.create(body);
  res.json({ ok:true, coupon: doc });
});

/**
 * GET /api/admin/coupons
 * List all coupons 
 */
router.get('/', async (req, res) => {
  const list = await Coupon.find().sort({ createdAt: -1 }).lean();
  res.json({ ok:true, coupons: list });
});

/**
 * PUT /api/admin/coupons/:id
 * Update coupon fields 
 */
router.put('/:id', async (req, res) => {
  const updated = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ ok:false, msg:'Coupon not found' });
  res.json({ ok:true, coupon: updated });
});

/**
 * POST /api/admin/coupons/:id/codes
 * Bulk generate single use codes for this coupon
 * body: { count: number, length?: number }
 */
router.post('/:id/codes', async (req, res) => {
  const { count=50, length=12 } = req.body || {};
  const couponId = req.params.id;

  const c = await Coupon.findById(couponId);
  if (!c) return res.status(404).json({ ok:false, msg:'Coupon not found' });
  if (!c.singleUse) return res.status(400).json({ ok:false, msg:'Only for singleUse coupons' });

  const docs = Array.from({length: count}, () => ({ couponId, code: genCode(length) }));
  await CouponCode.insertMany(docs);

  const codes = await CouponCode.find({ couponId }).sort({ createdAt: -1 }).limit(count).lean();
  res.json({ ok:true, generated: codes.length, codes });
});

/**
 * GET /api/admin/coupons/:id/codes
 * List codes for a coupon 
 */
router.get('/:id/codes', async (req, res) => {
  const couponId = req.params.id;
  const codes = await CouponCode.find({ couponId }).sort({ createdAt: -1 }).lean();
  res.json({ ok:true, total: codes.length, codes });
});

router.post('/:id/preflight', async (req, res) => {
  const hours = Math.max(1, Math.min(24, parseInt(req.query.hours || '1', 10)));
  const since = new Date(Date.now() - hours * 3600 * 1000);

  // Fetch recent decisions
  const [ total, blocked, challenged ] = await Promise.all([
    Redemption.countDocuments({ createdAt: { $gte: since } }),
    Redemption.countDocuments({ createdAt: { $gte: since }, decision: 'block' }),
    Redemption.countDocuments({ createdAt: { $gte: since }, decision: 'challenge' })
  ]);

  // Top rules in this window
  const topRules = await Redemption.aggregate([
    { $match: { createdAt: { $gte: since }, rulesHits: { $exists: true, $ne: [] } } },
    { $unwind: '$rulesHits' },
    { $group: { _id: '$rulesHits.id', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  const estBlockRate = total ? +(blocked/total).toFixed(3) : 0;
  const estChallengeRate = total ? +(challenged/total).toFixed(3) : 0;

  // One-line suggestion
  const suggestion =
    estBlockRate > 0.3
      ? 'High recent block rate: consider raising ip_burst/device_duplicate thresholds before activation.'
      : estChallengeRate > 0.2
      ? 'Many challenges recently: consider increasing challenge window or OTP friction only for new accounts.'
      : 'Looks safe to activate with current rules.';

  res.json({
    ok: true,
    windowHours: hours,
    totalChecked: total,
    estBlockRate,
    estChallengeRate,
    topRules,
    suggestion
  });
});

module.exports = router;
