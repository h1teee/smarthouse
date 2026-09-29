const fs = require('fs');
const path = '/home/alexandr/Рабочий стол/smarthouse-main/frontend/src/screens/UKBroadcastScreen/UKBroadcastScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove MOCK_ADDRESSES
content = content.replace(/const MOCK_ADDRESSES = \[\s*\{ id: '1'.*?\];/s, '');

// Inside UKBroadcastScreen: React.FC = () => {
content = content.replace(
  `const [searchQuery, setSearchQuery] = useState('');`,
  `const [addresses, setAddresses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch(API_URL + '/api/addresses')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAddresses(data.map((d: any) => ({
            id: String(d.id),
            name: d.full_address,
            district: 'Центральный' // Default or extracted
          })));
        }
      })
      .catch(console.error);
  }, []);`
);

content = content.replace(/MOCK_ADDRESSES/g, 'addresses');

fs.writeFileSync(path, content, 'utf8');
