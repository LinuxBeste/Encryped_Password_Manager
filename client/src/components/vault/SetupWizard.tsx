import { useState, useCallback, useMemo } from 'react';
import { Shield, Server, Mail, Key, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PasswordField } from '../ui/PasswordField';
import { testConnection, register } from '@/services/api.service';
import { scorePassword } from '@/utils/password';

interface SetupWizardProps {
  onComplete: (serverUrl: string, email: string, password: string) => void;
}

// Sample recovery seed words for initial setup
const RECOVERY_WORDS = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
  'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
  'acoustic', 'acquire', 'across', 'action', 'actor', 'actress', 'actual', 'adapt',
  'addict', 'address', 'adjust', 'admit', 'adult', 'advance', 'advice', 'aerobic',
  'affair', 'afford', 'afraid', 'again', 'age', 'agent', 'agree', 'ahead', 'aim',
  'alarm', 'album', 'alert', 'alien', 'align', 'alive', 'alley', 'allow', 'almost',
  'alone', 'along', 'aloud', 'alpha', 'alter', 'always', 'amaze', 'amberg', 'amuse',
  'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry', 'animal', 'ankle',
  'announce', 'annual', 'answer', 'antenna', 'antique', 'anxiety', 'any', 'apart',
  'apology', 'appear', 'apple', 'approve', 'april', 'arctic', 'area', 'arena',
  'argue', 'arise', 'armor', 'around', 'arrange', 'arrest', 'arrive', 'arrow',
  'artefact', 'artist', 'ask', 'aspect', 'assault', 'asset', 'assist', 'asthma',
  'athlete', 'atom', 'attic', 'attack', 'attend', 'attitude', 'attract', 'auction',
  'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado',
  'avoid', 'awake', 'award', 'aware', 'awful', 'axis', 'baby', 'bachelor', 'bacon',
  'badge', 'bag', 'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner',
  'bar', 'barely', 'bargain', 'barrel', 'base', 'basic', 'basket', 'battle',
  'beach', 'bean', 'beauty', 'because', 'become', 'beef', 'before', 'begin',
  'behave', 'behind', 'believe', 'below', 'belt', 'bench', 'benefit', 'best',
  'betray', 'better', 'between', 'beyond', 'bicycle', 'bid', 'bike', 'bind',
  'biology', 'bird', 'birth', 'bitter', 'black', 'blade', 'blame', 'blanket',
  'blast', 'bleak', 'bless', 'blind', 'blood', 'blossom', 'blouse', 'blue',
  'blur', 'blush', 'board', 'boat', 'body', 'boil', 'bomb', 'boost', 'border',
  'boring', 'borrow', 'boss', 'both', 'bother', 'bottle', 'bottom', 'bounce',
  'box', 'boy', 'bracket', 'brain', 'brand', 'brass', 'brave', 'bread', 'breeze',
  'brick', 'bridge', 'brief', 'bright', 'bring', 'brisk', 'broccoli', 'broken',
  'bronze', 'broom', 'brother', 'brown', 'brush', 'bubble', 'buddy', 'budget',
  'buffalo', 'build', 'bulb', 'bulk', 'bullet', 'bundle', 'bunker', 'burden',
  'burger', 'burst', 'bus', 'business', 'busy', 'butter', 'buyer', 'buzz',
  'cabbage', 'cabin', 'cable', 'cactus', 'cage', 'cake', 'call', 'calm',
  'camera', 'camp', 'can', 'canal', 'cancel', 'candy', 'cannon', 'canoe',
  'canvas', 'canyon', 'capable', 'capital', 'captain', 'car', 'carbon',
  'card', 'cargo', 'carpet', 'carry', 'cart', 'case', 'cash', 'casino',
  'castle', 'casual', 'catch', 'category', 'cattle', 'caught', 'cause',
  'caution', 'cave', 'ceiling', 'celery', 'cement', 'census', 'century',
  'ceremony', 'certain', 'chair', 'chalk', 'champion', 'change', 'chaos',
  'chapter', 'charge', 'chase', 'chat', 'cheap', 'check', 'cheese', 'chef',
  'cherry', 'chest', 'chicken', 'chief', 'child', 'chimney', 'choice',
  'choose', 'chronic', 'chuckle', 'chunk', 'churn', 'cigar', 'cinnamon',
  'circle', 'citizen', 'civic', 'civil', 'claim', 'clap', 'clarify', 'claw',
  'clay', 'clean', 'clerk', 'clever', 'click', 'client', 'cliff', 'climb',
  'clinic', 'clip', 'clock', 'clog', 'close', 'cloth', 'cloud', 'clown',
  'club', 'clump', 'cluster', 'clutch', 'coach', 'coast', 'coconut', 'code',
  'coffee', 'coil', 'coin', 'collect', 'color', 'column', 'combine', 'come',
  'comfort', 'comic', 'common', 'company', 'concert', 'conduct', 'confirm',
  'congress', 'connect', 'consider', 'control', 'convince', 'cook', 'cool',
  'copper', 'copy', 'coral', 'core', 'corn', 'correct', 'cost', 'cotton',
  'couch', 'country', 'couple', 'course', 'cousin', 'cover', 'coyote', 'crack',
  'cradle', 'craft', 'crane', 'crash', 'crater', 'crawl', 'crazy', 'cream',
  'credit', 'creek', 'crew', 'cricket', 'crime', 'crisp', 'critic', 'crop',
  'cross', 'crouch', 'crowd', 'crucial', 'cruel', 'cruise', 'crumble', 'crunch',
  'crush', 'cry', 'crystal', 'cube', 'culture', 'cup', 'cupboard', 'curious',
  'current', 'curtain', 'curve', 'cushion', 'custom', 'cute', 'cycle', 'dad',
  'damage', 'damp', 'dance', 'danger', 'daring', 'dash', 'daughter', 'dawn',
  'day', 'deal', 'debate', 'debris', 'decade', 'december', 'decide', 'decline',
  'decorate', 'decrease', 'deer', 'defense', 'define', 'defy', 'degree', 'delay',
  'deliver', 'demand', 'demise', 'denial', 'dentist', 'deny', 'depart', 'depend',
  'deposit', 'depth', 'deputy', 'derive', 'describe', 'desert', 'design', 'desk',
  'despair', 'destroy', 'detail', 'detect', 'develop', 'device', 'devote',
  'diagram', 'dial', 'diamond', 'diary', 'dice', 'diesel', 'diet', 'differ',
  'digital', 'dignity', 'dilemma', 'dinner', 'dinosaur', 'direct', 'dirt',
  'disagree', 'discover', 'disease', 'dish', 'dismiss', 'display', 'distance',
  'distinct', 'district', 'dive', 'divorce', 'dizzy', 'doctor', 'document',
  'dog', 'doll', 'dolphin', 'domain', 'donate', 'donkey', 'donor', 'door',
  'dose', 'double', 'dove', 'draft', 'dragon', 'drama', 'drastic', 'draw',
  'dream', 'dress', 'drift', 'drill', 'drink', 'drip', 'drive', 'drop',
  'drum', 'drunk', 'dry', 'duck', 'dumb', 'dune', 'during', 'dust', 'dutch',
  'duty', 'dwarf', 'dynamic', 'eager', 'eagle', 'early', 'earn', 'earth',
  'easily', 'east', 'easy', 'echo', 'ecology', 'economy', 'edge', 'edit',
  'educate', 'effort', 'egg', 'eight', 'either', 'elbow', 'elder', 'electric',
  'elegant', 'element', 'elephant', 'elevator', 'elite', 'else', 'embark',
  'embody', 'embrace', 'emerge', 'emotion', 'employ', 'empower', 'empty',
  'enable', 'enact', 'end', 'endless', 'endorse', 'enemy', 'energy', 'enforce',
  'engage', 'engine', 'enhance', 'enjoy', 'enlist', 'enough', 'enrich', 'enroll',
  'ensure', 'enter', 'entire', 'entry', 'envelope', 'episode', 'equal', 'equip',
  'era', 'erase', 'erode', 'erosion', 'error', 'erupt', 'escape', 'essay',
  'essence', 'estate', 'eternal', 'ethics', 'evidence', 'evil', 'evoke',
  'evolve', 'exact', 'example', 'exceed', 'exchange', 'excite', 'exclude',
  'excuse', 'execute', 'exercise', 'exhaust', 'exhibit', 'exile', 'exist',
  'exit', 'expand', 'expect', 'expire', 'explain', 'expose', 'extend',
  'extra', 'extreme', 'eye', 'fabric', 'face', 'faculty', 'fade', 'faint',
  'faith', 'fall', 'false', 'fame', 'family', 'famous', 'fan', 'fancy',
  'fantasy', 'farm', 'fashion', 'fat', 'fatal', 'father', 'fatigue', 'fault',
  'favorite', 'feature', 'february', 'federal', 'fee', 'feed', 'feel', 'female',
  'fence', 'festival', 'fetch', 'fever', 'few', 'fiber', 'fiction', 'field',
  'figure', 'file', 'film', 'filter', 'final', 'find', 'fine', 'finger',
  'finish', 'fire', 'firm', 'first', 'fiscal', 'fish', 'fit', 'fitness',
  'fix', 'flag', 'flame', 'flash', 'flat', 'flavor', 'flee', 'flight',
  'flip', 'float', 'flock', 'floor', 'floss', 'flower', 'fluid', 'flush',
  'fly', 'foam', 'focus', 'fog', 'foil', 'fold', 'follow', 'food', 'foot',
  'force', 'forest', 'forget', 'fork', 'fortune', 'forum', 'forward', 'fossil',
  'foster', 'found', 'fox', 'fragile', 'frame', 'frequent', 'fresh', 'friend',
  'fringe', 'frog', 'front', 'frost', 'frown', 'frozen', 'fruit', 'fuel',
  'fun', 'funny', 'furnace', 'fury', 'future', 'gadget', 'gain', 'galaxy',
  'gallery', 'game', 'gap', 'garage', 'garbage', 'garden', 'garlic', 'garment',
  'gas', 'gasp', 'gate', 'gather', 'gauge', 'gaze', 'general', 'genius',
  'genre', 'gentle', 'genuine', 'gesture', 'ghost', 'giant', 'gift', 'giggle',
  'ginger', 'giraffe', 'girl', 'give', 'glad', 'glance', 'glare', 'glass',
  'glide', 'glimpse', 'globe', 'gloom', 'glory', 'glove', 'glow', 'glue',
  'goal', 'goat', 'goddess', 'gold', 'good', 'goose', 'gorilla', 'gospel',
  'gossip', 'govern', 'gown', 'grab', 'grace', 'grain', 'grant', 'grape',
  'grass', 'gravity', 'great', 'green', 'grid', 'grief', 'grit', 'grocery',
  'group', 'grow', 'growth', 'guarantee', 'guard', 'guess', 'guest', 'guide',
  'guilt', 'guitar', 'gun', 'gym', 'habit', 'hair', 'half', 'hammer',
  'hamster', 'hand', 'happy', 'harbor', 'hard', 'harsh', 'harvest', 'hat',
  'have', 'hawk', 'hazard', 'head', 'health', 'heart', 'heavy', 'hedgehog',
  'height', 'hello', 'helmet', 'help', 'hen', 'hero', 'hidden', 'high',
  'hill', 'hint', 'hip', 'hire', 'history', 'hobby', 'hockey', 'hold',
  'hole', 'holiday', 'hollow', 'home', 'honey', 'hood', 'hope', 'horn',
  'horror', 'horse', 'hospital', 'host', 'hotel', 'hour', 'hover', 'hub',
  'huge', 'human', 'humble', 'humor', 'hundred', 'hungry', 'hunt', 'hurdle',
  'hurry', 'hurt', 'husband', 'hybrid', 'ice', 'icon', 'idea', 'identify',
  'idle', 'ignore', 'ill', 'illegal', 'illness', 'image', 'imitate', 'immense',
  'immune', 'impact', 'impose', 'improve', 'impulse', 'inch', 'include',
  'income', 'increase', 'index', 'indicate', 'indoor', 'industry', 'infant',
  'inflict', 'inform', 'inhale', 'inherit', 'initial', 'inject', 'injury',
  'inmate', 'inner', 'innocent', 'input', 'inquiry', 'insane', 'insect',
  'inside', 'inspire', 'install', 'intact', 'interest', 'into', 'invest',
  'invite', 'involve', 'iron', 'island', 'isolate', 'issue', 'item', 'ivory',
  'jacket', 'jaguar', 'jar', 'jazz', 'jealous', 'jeans', 'jelly', 'jewel',
  'job', 'join', 'joke', 'journey', 'joy', 'judge', 'juice', 'jump', 'jungle',
  'junior', 'junk', 'just', 'kangaroo', 'keen', 'keep', 'ketchup', 'key',
  'kick', 'kid', 'kidney', 'kind', 'kingdom', 'kiss', 'kit', 'kitchen',
  'kite', 'kitten', 'kiwi', 'knee', 'knife', 'knock', 'know', 'lab', 'label',
  'labor', 'ladder', 'lady', 'lake', 'lamp', 'language', 'laptop', 'large',
  'later', 'latin', 'laugh', 'laundry', 'lava', 'law', 'lawn', 'lawsuit',
  'layer', 'lazy', 'leader', 'leaf', 'learn', 'leave', 'lecture', 'left',
  'leg', 'legal', 'legend', 'leisure', 'lemon', 'lend', 'length', 'lens',
  'leopard', 'lesson', 'letter', 'level', 'liar', 'liberty', 'library',
  'license', 'life', 'lift', 'light', 'like', 'limb', 'limit', 'link',
  'lion', 'liquid', 'list', 'little', 'live', 'lizard', 'load', 'loan',
  'lobster', 'local', 'lock', 'logic', 'lonely', 'long', 'loop', 'lottery',
  'loud', 'lounge', 'love', 'loyal', 'lucky', 'luggage', 'lumber', 'lunar',
  'lunch', 'luxury', 'lyrics', 'machine', 'mad', 'magic', 'magnet', 'maid',
  'mail', 'main', 'major', 'make', 'mammal', 'man', 'manage', 'mandate',
  'mango', 'mansion', 'manual', 'maple', 'marble', 'march', 'margin', 'marine',
  'market', 'marriage', 'mask', 'mass', 'master', 'match', 'material', 'math',
  'matrix', 'matter', 'maximum', 'maze', 'meadow', 'mean', 'measure', 'meat',
  'mechanic', 'medal', 'media', 'melody', 'melt', 'member', 'memory', 'mention',
  'menu', 'mercy', 'merge', 'merit', 'merry', 'mesh', 'message', 'metal',
  'method', 'middle', 'midnight', 'milk', 'million', 'mimic', 'mind', 'minimum',
  'minor', 'minute', 'miracle', 'mirror', 'misery', 'miss', 'mistake', 'mix',
  'mixed', 'mixture', 'mobile', 'model', 'modify', 'mom', 'moment', 'monitor',
  'monkey', 'monster', 'month', 'moon', 'moral', 'more', 'morning', 'mosquito',
  'mother', 'motion', 'motor', 'mountain', 'mouse', 'move', 'movie', 'much',
  'muffin', 'mule', 'multiply', 'muscle', 'museum', 'mushroom', 'music',
  'must', 'mutual', 'myself', 'mystery', 'myth', 'naive', 'name', 'napkin',
  'narrow', 'nasty', 'nation', 'nature', 'near', 'neck', 'need', 'negative',
  'neglect', 'neither', 'nephew', 'nerve', 'nest', 'net', 'network', 'neutral',
  'never', 'news', 'next', 'nice', 'night', 'noble', 'noise', 'nominee',
  'noodle', 'normal', 'north', 'nose', 'notable', 'note', 'nothing', 'notice',
  'novel', 'now', 'nuclear', 'number', 'nurse', 'nut', 'oak', 'object',
  'oblige', 'obscure', 'observe', 'obtain', 'obvious', 'occur', 'ocean',
  'october', 'odor', 'off', 'offend', 'offer', 'office', 'often', 'oil',
  'okay', 'old', 'olive', 'olympic', 'omit', 'once', 'one', 'onion', 'online',
  'only', 'open', 'opera', 'opinion', 'oppose', 'option', 'orange', 'orbit',
  'orchard', 'order', 'ordinary', 'organ', 'orient', 'original', 'orphan',
  'ostrich', 'other', 'outdoor', 'outer', 'output', 'outside', 'oval', 'oven',
  'over', 'own', 'owner', 'oxygen', 'oyster', 'ozone', 'pact', 'paddle',
  'page', 'pair', 'palace', 'palm', 'panda', 'panel', 'panic', 'panther',
  'paper', 'parade', 'parent', 'park', 'parrot', 'party', 'pass', 'patch',
  'path', 'patient', 'patrol', 'pattern', 'pause', 'pave', 'payment', 'peace',
  'peanut', 'pear', 'peasant', 'pelican', 'pen', 'penalty', 'pencil', 'people',
  'pepper', 'perfect', 'permit', 'person', 'pet', 'phone', 'photo', 'phrase',
  'physical', 'piano', 'picnic', 'picture', 'piece', 'pig', 'pigeon', 'pill',
  'pilot', 'pink', 'pioneer', 'pipe', 'pistol', 'pitch', 'pizza', 'place',
  'planet', 'plastic', 'plate', 'play', 'player', 'please', 'pledge', 'pluck',
  'plug', 'plunge', 'poem', 'poet', 'point', 'polar', 'pole', 'police',
  'pond', 'pony', 'pool', 'popular', 'portion', 'position', 'possible',
  'post', 'potato', 'pottery', 'poverty', 'powder', 'power', 'practice',
  'praise', 'predict', 'prefer', 'prepare', 'present', 'pretty', 'prevent',
  'price', 'pride', 'primary', 'print', 'priority', 'prison', 'private',
  'prize', 'problem', 'process', 'produce', 'profit', 'program', 'project',
  'promote', 'proof', 'property', 'prosper', 'protect', 'proud', 'provide',
  'public', 'pudding', 'pull', 'pulp', 'pulse', 'pumpkin', 'punch', 'pupil',
  'puppy', 'purchase', 'purity', 'purpose', 'purse', 'push', 'put', 'puzzle',
  'pyramid', 'quality', 'quantum', 'quarter', 'question', 'quick', 'quit',
  'quiz', 'quote', 'rabbit', 'raccoon', 'race', 'rack', 'radar', 'radio',
  'rail', 'rain', 'raise', 'rally', 'ramp', 'ranch', 'random', 'range',
  'rapid', 'rare', 'rate', 'rather', 'raven', 'raw', 'razor', 'ready',
  'real', 'reason', 'rebel', 'rebuild', 'recall', 'receive', 'recipe',
  'record', 'recycle', 'reduce', 'reflect', 'reform', 'refuse', 'region',
  'regret', 'regular', 'reject', 'relax', 'release', 'relief', 'rely',
  'remain', 'remember', 'remind', 'remove', 'render', 'renew', 'rent',
  'reopen', 'repair', 'repeat', 'replace', 'report', 'require', 'rescue',
  'resign', 'resist', 'resource', 'response', 'result', 'retire', 'retreat',
  'return', 'reunion', 'reveal', 'review', 'reward', 'rhythm', 'rib',
  'ribbon', 'rice', 'rich', 'ride', 'ridge', 'rifle', 'right', 'rigid',
  'ring', 'riot', 'rip', 'ripe', 'rise', 'risk', 'rival', 'river', 'road',
  'roast', 'robot', 'robust', 'rocket', 'romance', 'roof', 'rookie', 'room',
  'rose', 'rotate', 'rough', 'round', 'route', 'royal', 'rubber', 'rude',
  'rug', 'rule', 'run', 'runway', 'rural', 'sad', 'saddle', 'sadness',
  'safe', 'sail', 'salad', 'salmon', 'salon', 'salt', 'salute', 'same',
  'sample', 'sand', 'satisfy', 'satoshi', 'sauce', 'sausage', 'save', 'scale',
  'scan', 'scare', 'scatter', 'scene', 'scheme', 'school', 'science', 'scissors',
  'scorpion', 'scout', 'scrap', 'screen', 'script', 'scrub', 'sea', 'search',
  'season', 'seat', 'second', 'secret', 'section', 'security', 'seed', 'seek',
  'segment', 'select', 'sell', 'seminar', 'senior', 'sense', 'sentence',
  'series', 'service', 'session', 'settle', 'setup', 'seven', 'shadow', 'shaft',
  'shallow', 'share', 'shed', 'shell', 'sheriff', 'shield', 'shift', 'shine',
  'ship', 'shiver', 'shock', 'shoe', 'shoot', 'shop', 'short', 'shoulder',
  'shove', 'shrimp', 'shrug', 'shuffle', 'shy', 'sibling', 'sick', 'side',
  'siege', 'sight', 'sign', 'silent', 'silk', 'silly', 'silver', 'similar',
  'simple', 'since', 'sing', 'siren', 'sister', 'situate', 'six', 'size',
  'skate', 'sketch', 'ski', 'skill', 'skin', 'skirt', 'skull', 'slab',
  'slam', 'sleep', 'slender', 'slice', 'slide', 'slight', 'slim', 'slogan',
  'slot', 'slow', 'slush', 'small', 'smart', 'smile', 'smoke', 'smooth',
  'snack', 'snake', 'snap', 'sniff', 'snow', 'soap', 'soccer', 'social',
  'sock', 'soda', 'soft', 'solar', 'soldier', 'solid', 'solution', 'solve',
  'someone', 'song', 'soon', 'sorry', 'sort', 'soul', 'sound', 'soup',
  'source', 'south', 'space', 'spare', 'spatial', 'spawn', 'speak', 'special',
  'speed', 'spell', 'spend', 'sphere', 'spice', 'spider', 'spike', 'spin',
  'spirit', 'split', 'spoil', 'sponsor', 'spoon', 'sport', 'spot', 'spray',
  'spread', 'spring', 'spy', 'square', 'squeeze', 'squirrel', 'stable', 'stadium',
  'staff', 'stage', 'stairs', 'stamp', 'stand', 'start', 'state', 'stay',
  'steak', 'steel', 'step', 'stereo', 'stick', 'still', 'sting', 'stock',
  'stomach', 'stone', 'stool', 'story', 'stove', 'strategy', 'street', 'strike',
  'strong', 'struggle', 'student', 'stuff', 'stumble', 'style', 'subject',
  'submit', 'subway', 'success', 'such', 'sudden', 'suffer', 'sugar', 'suggest',
  'suit', 'sun', 'sunny', 'sunset', 'super', 'supply', 'support', 'suppose',
  'sure', 'surface', 'surge', 'surprise', 'surround', 'survey', 'suspect',
  'sustain', 'swallow', 'swamp', 'swap', 'swarm', 'swear', 'sweet', 'swift',
  'swim', 'swing', 'switch', 'sword', 'symbol', 'symptom', 'syrup', 'system',
  'table', 'tackle', 'tag', 'tail', 'talent', 'talk', 'tank', 'tape', 'target',
  'task', 'taste', 'tattoo', 'taxi', 'teach', 'team', 'tell', 'ten', 'tenant',
  'tennis', 'tent', 'term', 'test', 'text', 'thank', 'that', 'theme', 'then',
  'theory', 'there', 'they', 'thing', 'this', 'thought', 'three', 'thrive',
  'throw', 'thumb', 'thunder', 'ticket', 'tide', 'tiger', 'tilt', 'timber',
  'time', 'tiny', 'tip', 'tired', 'tissue', 'title', 'toast', 'tobacco',
  'today', 'toddler', 'toe', 'together', 'toilet', 'token', 'tomato', 'tomorrow',
  'tone', 'tongue', 'tonight', 'tool', 'tooth', 'top', 'topic', 'topple',
  'torch', 'tornado', 'tortoise', 'toss', 'total', 'tourist', 'toward', 'tower',
  'town', 'toy', 'track', 'trade', 'traffic', 'tragic', 'train', 'transfer',
  'trap', 'trash', 'travel', 'tray', 'treat', 'tree', 'trend', 'trial',
  'tribe', 'trick', 'trigger', 'trim', 'trip', 'trophy', 'trouble', 'truck',
  'true', 'truly', 'trumpet', 'trust', 'truth', 'try', 'tube', 'tuition',
  'tumble', 'tuna', 'tunnel', 'turkey', 'turn', 'turtle', 'twelve', 'twenty',
  'twice', 'twin', 'twist', 'two', 'type', 'typical', 'ugly', 'umbrella',
  'unable', 'unaware', 'uncle', 'uncover', 'under', 'undo', 'unfair', 'unfold',
  'unhappy', 'uniform', 'unique', 'unit', 'universe', 'unknown', 'unlock',
  'until', 'unusual', 'unveil', 'update', 'upgrade', 'uphold', 'upon', 'upper',
  'upset', 'urban', 'urge', 'usage', 'use', 'used', 'useful', 'useless',
  'usual', 'utility', 'vacant', 'vacuum', 'vague', 'valid', 'valley', 'valve',
  'van', 'vanish', 'vapor', 'various', 'vast', 'vault', 'vehicle', 'velvet',
  'vendor', 'venture', 'venue', 'verb', 'verify', 'version', 'very', 'vessel',
  'veteran', 'viable', 'vibrant', 'vicious', 'victory', 'video', 'view',
  'village', 'vintage', 'violin', 'virtual', 'virus', 'visa', 'visit',
  'visual', 'vital', 'vivid', 'vocal', 'voice', 'void', 'volcano', 'volume',
  'vote', 'voyage', 'wage', 'wagon', 'wait', 'walk', 'wall', 'walnut',
  'want', 'warfare', 'warm', 'warrior', 'wash', 'wasp', 'waste', 'water',
  'wave', 'way', 'wealth', 'weapon', 'wear', 'weasel', 'weather', 'web',
  'wedding', 'weekend', 'weird', 'welcome', 'west', 'wet', 'whale', 'what',
  'wheat', 'wheel', 'when', 'where', 'whip', 'whisper', 'wide', 'width',
  'wife', 'wild', 'will', 'win', 'window', 'wine', 'wing', 'wink', 'winner',
  'winter', 'wire', 'wisdom', 'wise', 'wish', 'witness', 'wolf', 'woman',
  'wonder', 'wood', 'wool', 'word', 'work', 'world', 'worry', 'worth',
  'wrap', 'wreck', 'wrestle', 'wrist', 'write', 'wrong', 'yard', 'year',
  'yellow', 'you', 'young', 'youth', 'zebra', 'zero', 'zone', 'zoo',
];

const STEPS = ['Welcome', 'Server', 'Account', 'Recovery', 'Done'];

// Multi-step first-time setup wizard for vault configuration
export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(0);
  const [serverUrl, setServerUrl] = useState('http://localhost:3000/api');
  const [testing, setTesting] = useState(false);
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmedRecovery, setConfirmedRecovery] = useState(false);

  const passwordScore = password ? scorePassword(password).score : 0;
  const recoveryPhrase = useMemo(() => {
    const words = [...RECOVERY_WORDS];
    const indices = new Uint32Array(words.length);
    crypto.getRandomValues(indices);
    for (let i = words.length - 1; i > 0; i--) {
      const j = indices[i] % (i + 1);
      [words[i], words[j]] = [words[j], words[i]];
    }
    return words.slice(0, 12).join(' ');
  }, []);

  // Test server connection and update status
  const handleTestConnection = useCallback(async () => {
    setTesting(true);
    const ok = await testConnection(serverUrl);
    setConnectionOk(ok);
    setTesting(false);
  }, [serverUrl]);

  // Determine if current step allows proceeding
  const canNext = () => {
    switch (step) {
      case 0: return true;
      case 1: return connectionOk === true && serverUrl.length > 0;
      case 2: return email.length > 0 && password.length >= 8 && password === confirmPassword;
      case 3: return confirmedRecovery;
      default: return true;
    }
  };

  // Advance or complete the wizard
  const handleNext = () => {
    if (step === STEPS.length - 1) {
      onComplete(serverUrl, email, password);
      return;
    }
    setStep((p) => Math.min(p + 1, STEPS.length - 1));
  };

  return (
    <div className="flex items-center justify-center h-full bg-app">
      <div className="w-full max-w-lg px-8">
        {/* Step indicator dots */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${i <= step ? 'bg-accent' : 'bg-surface'}`} />
            ))}
          </div>
        </div>

        <div className="bg-panel border border-border rounded-lg p-6">
          {/* Welcome step */}
          {step === 0 && (
            <div className="text-center space-y-4">
              <Shield className="w-12 h-12 text-accent mx-auto" />
              <h1 className="text-heading font-bold text-text-primary">Welcome to VaultLock</h1>
              <div className="space-y-2 text-left">
                {['Military-grade AES-256-GCM encryption', 'Zero-knowledge architecture', 'Cross-device sync'].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-body text-text-muted">
                    <Check className="w-4 h-4 text-accent-green shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Server connection step */}
          {step === 1 && (
            <div className="space-y-4">
              <Server className="w-10 h-10 text-accent" />
              <h2 className="text-heading font-semibold text-text-primary">Server Configuration</h2>
              <Input
                label="Server URL"
                value={serverUrl}
                onChange={(e) => { setServerUrl(e.target.value); setConnectionOk(null); }}
                placeholder="http://localhost:3000/api"
              />
              <Button variant="secondary" size="md" onClick={handleTestConnection} loading={testing}>
                Test Connection
              </Button>
              {connectionOk === true && <p className="text-body text-accent-green">Connection successful!</p>}
              {connectionOk === false && <p className="text-body text-accent-red">Connection failed</p>}
            </div>
          )}

          {/* Account creation step */}
          {step === 2 && (
            <div className="space-y-4">
              <Mail className="w-10 h-10 text-accent" />
              <h2 className="text-heading font-semibold text-text-primary">Create Account</h2>
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              <div>
                <label className="text-caption text-text-muted uppercase tracking-wide font-medium mb-1.5 block">Master Password</label>
                <PasswordField value={password} onChange={setPassword} showStrength strengthScore={passwordScore} />
              </div>
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
              />
            </div>
          )}

          {/* Recovery phrase step */}
          {step === 3 && (
            <div className="space-y-4">
              <Key className="w-10 h-10 text-accent-amber" />
              <h2 className="text-heading font-semibold text-text-primary">Recovery Key</h2>
              <p className="text-body text-text-muted">Write down these words. They are your only recovery method if you lose your master password.</p>
              <div className="bg-surface border border-border rounded-md p-4 font-mono text-body text-text-primary leading-relaxed select-all">
                {recoveryPhrase}
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedRecovery}
                  onChange={(e) => setConfirmedRecovery(e.target.checked)}
                  className="mt-0.5 accent-accent"
                />
                <span className="text-body text-text-muted">I have saved my recovery key in a secure location</span>
              </label>
            </div>
          )}

          {/* Completion step */}
          {step === 4 && (
            <div className="text-center space-y-4">
              <Check className="w-12 h-12 text-accent-green mx-auto" />
              <h2 className="text-heading font-semibold text-text-primary">You're all set!</h2>
              <p className="text-body text-text-muted">Your vault is ready. Use Cmd+K to search, Cmd+N to add entries.</p>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="ghost"
            size="md"
            onClick={() => setStep((p) => Math.max(p - 1, 0))}
            disabled={step === 0}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button variant="primary" size="md" onClick={handleNext} disabled={!canNext()}>
            {step === STEPS.length - 1 ? 'Finish' : 'Next'}
            {step < STEPS.length - 1 && <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
