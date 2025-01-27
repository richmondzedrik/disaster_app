<template>
  <div class="emergency-contacts">
    <div class="header">
      <h1>Emergency Contacts</h1>
      <p>Important contact numbers for emergency situations in Abra</p>
    </div>

    <div class="search-filter-container">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search contacts..."
        />
      </div>
      
      <div class="filter-box">
        <select v-model="selectedCategory">
          <option value="">All Categories</option>
          <option value="pdrrmc">PDRRMC Officials</option>
          <option value="staff">PDRRMC Staff</option>
          <option value="responders">Rescue Responders</option>
          <option value="municipal">Municipal Hotlines</option>
        </select>
      </div>
    </div>

    <div class="contacts-section" v-if="filteredContacts.length">
      <template v-for="(group, category) in groupedContacts" :key="category">
        <div v-if="group.contacts.length" class="contact-group">
          <h2>{{ group.title }}</h2>
          <div class="contacts-grid">
            <div 
              v-for="contact in group.contacts" 
              :key="contact.id" 
              class="contact-card"
              :class="{ 'highlight': isHighlighted(contact) }"
            >
              <i :class="contact.icon"></i>
              <h3>{{ contact.title }}</h3>
              <p class="name" v-if="contact.name">{{ contact.name }}</p>
              <template v-if="Array.isArray(contact.numbers)">
                <p v-for="(number, idx) in contact.numbers" 
                   :key="idx" 
                   class="number">
                  {{ number }}
                </p>
              </template>
              <p class="number" v-else>{{ contact.number }}</p>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div v-else class="no-results">
      <i class="fas fa-search"></i>
      <p>No contacts found matching your search</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const searchQuery = ref('');
const selectedCategory = ref('');

const rescueResponders = [
  { name: 'Catherine P. Mann', phone: '0997-773-6482' },
  { name: 'Carmelita C. Tesoro', phone: '0935-047-8041' },
  { name: 'Mar Einnor B. Sapongen', phone: '0956-810-2712' },
  { name: 'May Ann C. Antonio', phone: '0929-398-5186' },
  { name: 'Bee Jhay B. Molina', phone: '0961-488-1704' },
  { name: 'Dhailan Lie B. Belarmino', phone: '0961-836-7755' },
  { name: 'Kevin M. Reginaldo', phone: '0926-974-2587' },
  { name: 'Jaymark T. Dacanay', phone: '0906-743-3622' },
  { name: 'Marvel B. Buenafe', phone: '0955-543-5749' },
  { name: 'Gerald O. Pisco', phone: '0906-590-7908' }
];

const municipalities = [
  {
    name: 'Bangued',
    contacts: [
      { label: 'MDRRMO', number: '0906-884-4734 / 0965-721-2698' },
      { label: 'BFP', number: '0906-675-2272' },
      { label: 'MPS', number: '0927-377-1715 / 0998-598-7690' }
    ]
  },
  {
    name: 'Boliney',
    contacts: [
      { label: 'MDRRMO', number: '0906-544-6884' },
      { label: 'MPS', number: '0915-856-3847' }
    ]
  },
  {
    name: 'Bucloc',
    contacts: [
      { label: 'MDRRMO', number: '0975-419-7962' },
      { label: 'MPS', number: '0995-260-4892' }
    ]
  },
  {
    name: 'Bucay',
    contacts: [
      { label: 'MDRRMO', number: '0961-639-5063 / 0955-827-5754' },
      { label: 'BFP', number: '0927-378-8391' },
      { label: 'MPS', number: '0916-610-1660 / 0998-598-7692' }
    ]
  },
  {
    name: 'Daguioman',
    contacts: [
      { label: 'MDRRMO', number: '0927-254-1149 / 0995-031-1648' },
      { label: 'MPS', number: '0917-427-3103' }
    ]
  },
  {
    name: 'Danglas',
    contacts: [
      { label: 'MDRRMO', number: '0917-147-7534 / 0906-884-5839' },
      { label: 'MPS', number: '0905-464-1676 / 0998-598-7695' }
    ]
  },
  {
    name: 'Dolores',
    contacts: [
      { label: 'MDRRMO', number: '0906-477-7146 / 0935-851-1609' },
      { label: 'BFP', number: '0905-259-4083 / 0916-725-2041' },
      { label: 'MPS', number: '0965-842-5791 / 0998-598-7697' }
    ]
  },
  {
    name: 'La Paz',
    contacts: [
      { label: 'MDRRMO', number: '0939-831-6832 / 0906-356-8002' },
      { label: 'BFP', number: '0945-422-1598' },
      { label: 'MPS', number: '0927-661-8342 / 0998-598-7697' }
    ]
  },
  {
    name: 'Lacub',
    contacts: [
      { label: 'MDRRMO', number: '0917-804-1712 / 0906-306-7676' },
      { label: 'MPS', number: '0936-817-6059' }
    ]
  },
  {
    name: 'Lagayan',
    contacts: [
      { label: 'MDRRMO', number: '0917-426-2212' },
      { label: 'BFP', number: '0920-447-8436' },
      { label: 'MPS', number: '0995-397-2124' }
    ]
  },
  {
    name: 'Langiden',
    contacts: [
      { label: 'MDRRMO', number: '0960-529-2959' },
      { label: 'MPS', number: '0916-288-1079 / 0998-598-7702' }
    ]
  },
  {
    name: 'Langagilang',
    contacts: [
      { label: 'MDRRMO', number: '0916-524-6694' },
      { label: 'BFP', number: '0967-954-8323 / 0916-953-8194' },
      { label: 'MPS', number: '0905-416-1982 / 0998-598-7699' }
    ]
  },
  {
    name: 'Licuan-Baay',
    contacts: [
      { label: 'MDRRMO', number: '0965-067-9014 / 0908-495-9197' },
      { label: 'BFP', number: '0916-522-4309' },
      { label: 'MPS', number: '0968-590-6517 / 0998-598-7703' }
    ]
  },
  {
    name: 'Luba',
    contacts: [
      { label: 'MDRRMO', number: '0917-516-7311 / 0961-216-9604' },
      { label: 'MPS', number: '0915-738-9194 / 0998-598-7703' }
    ]
  },
  {
    name: 'Malibcong',
    contacts: [
      { label: 'MDRRMO', number: '0917-516-7311 / 0945-110-7869' },
      { label: 'MPS', number: '0916-420-0740' }
    ]
  },
  {
    name: 'Manabo',
    contacts: [
      { label: 'MDRRMO', number: '0917-168-8643' },
      { label: 'BFP', number: '0905-079-6586' },
      { label: 'MPS', number: '0927-405-5898' }
    ]
  },
  {
    name: 'Peñarrubia',
    contacts: [
      { label: 'MDRRMO', number: '0910-902-4793' },
      { label: 'BFP', number: '0997-573-4087' },
      { label: 'MPS', number: '0927-405-5370' }
    ]
  },
  {
    name: 'Pidigan',
    contacts: [
      { label: 'MDRRMO', number: '0969-621-0427' },
      { label: 'BFP', number: '0977-677-6185' },
      { label: 'MPS', number: '0955-018-8076' }
    ]
  },
  {
    name: 'Pilar',
    contacts: [
      { label: 'MDRRMO', number: '0969-177-5752 / 0945-453-0671' },
      { label: 'MPS', number: '0927-486-0640' }
    ]
  },
  {
    name: 'Sal-Lapadan',
    contacts: [
      { label: 'MDRRMO', number: '0906-440-2140' },
      { label: 'BFP', number: '0926-314-7439' },
      { label: 'MPS', number: '0927-415-6134' }
    ]
  },
  {
    name: 'San Isidro',
    contacts: [
      { label: 'MDRRMO', number: '0977-604-6595' },
      { label: 'MPS', number: '0915-814-7303' }
    ]
  },
  {
    name: 'San Juan',
    contacts: [
      { label: 'MDRRMO', number: '0915-375-3684' },
      { label: 'BFP', number: '0908-202-4995 / 0995-927-2344' },
      { label: 'MPS', number: '0916-594-7463' }
    ]
  },
  {
    name: 'San Quintin',
    contacts: [
      { label: 'MDRRMO', number: '0906-375-6580' },
      { label: 'BFP', number: '0927-299-8284 / 0936-954-0297' },
      { label: 'MPS', number: '0917-702-2036' }
    ]
  },
  {
    name: 'Tayum',
    contacts: [
      { label: 'MDRRMO', number: '0917-522-4592' },
      { label: 'BFP', number: '0948-0543-2003 / 0912-801-3645' },
      { label: 'MPS', number: '0997-971-2017' }
    ]
  },
  {
    name: 'Tineg',
    contacts: [
      { label: 'MDRRMO', number: '0916-111-4325' },
      { label: 'MPS', number: '0926-814-1532' }
    ]
  },
  {
    name: 'Tubo',
    contacts: [
      { label: 'MDRRMO', number: '0917-722-4638 / 0906-440-1929' },
      { label: 'MPS', number: '0921-673-0946' }
    ]
  },
  {
    name: 'Villaviciosa',
    contacts: [
      { label: 'MDRRMO', number: '0997-889-7121' },
      { label: 'BFP', number: '0938-673-8699 / 0977-213-8853' },
      { label: 'MPS', number: '0905-421-6610' }
    ]
  }
];

// Organize contact data
const contactsData = {
  pdrrmc: {
    title: 'PDRRMC Officials',
    contacts: [
      {
        id: 1,
        icon: 'fas fa-user-shield',
        title: 'PDO IV/ PDRRMO Designate',
        name: 'Arnel D. Valdez',
        number: '0955-289-6284',
        category: 'pdrrmc'
      },
      {
        id: 2,
        icon: 'fas fa-user-shield',
        title: 'LDRRMO III, OSC',
        name: 'Arnel C. Garcia',
        number: '0935-850-9864',
        category: 'pdrrmc'
      },
      {
        id: 3,
        icon: 'fas fa-user-shield',
        title: 'LDRRM Assistant',
        name: 'Ronald B. Sequerra',
        number: '0926-075-6610',
        category: 'pdrrmc'
      }
    ]
  },
  staff: {
    title: 'PDRRMC Staff',
    contacts: [
      {
        id: 4,
        icon: 'fas fa-user',
        title: 'Admin AIDE III',
        name: 'Marc Ronald C. Lampa',
        number: '0936-125-9569',
        category: 'staff'
      },
      {
        id: 5,
        icon: 'fas fa-user',
        title: 'Utility',
        name: 'Rosemarie D. Baro',
        number: '0905-755-8557',
        category: 'staff'
      }
    ]
  },
  responders: {
    title: 'Rescue Responders',
    contacts: rescueResponders.map((responder, index) => ({
      id: index + 1,
      icon: 'fas fa-user-md',
      title: 'Rescue Responder',
      name: responder.name,
      number: responder.phone,
      category: 'responders'
    }))
  },
  municipal: {
    title: 'Municipal Hotlines',
    contacts: municipalities.map((municipality, index) => ({
      id: index + 1,
      icon: 'fas fa-building',
      title: municipality.name,
      contacts: municipality.contacts.map((contact, contactIndex) => ({
        id: contactIndex + 1,
        label: contact.label,
        number: contact.number,
        category: 'municipal'
      })),
      category: 'municipal'
    }))
  }
};

const filteredContacts = computed(() => {
  let contacts = [];
  
  Object.values(contactsData).forEach(group => {
    contacts = contacts.concat(group.contacts);
  });

  return contacts.filter(contact => {
    const searchContent = [
      contact.name,
      contact.title,
      contact.number,
      ...(contact.numbers || [])
    ].join(' ').toLowerCase();

    const matchesSearch = !searchQuery.value || 
      searchContent.includes(searchQuery.value.toLowerCase());

    const matchesCategory = !selectedCategory.value || 
      contact.category === selectedCategory.value;

    return matchesSearch && matchesCategory;
  });
});

const groupedContacts = computed(() => {
  const groups = {
    pdrrmc: {
      title: 'PDRRMC Officials',
      contacts: contactsData.pdrrmc.contacts
    },
    staff: {
      title: 'PDRRMC Staff',
      contacts: contactsData.staff.contacts
    },
    responders: {
      title: 'Rescue Responders',
      contacts: contactsData.responders.contacts
    },
    municipal: {
      title: 'Municipal Hotlines',
      contacts: municipalities.map(mun => ({
        id: `mun-${mun.name}`,
        icon: 'fas fa-building',
        title: mun.name,
        numbers: mun.contacts.map(contact => `${contact.label}: ${contact.number}`),
        category: 'municipal'
      }))
    }
  };

  if (!searchQuery.value && !selectedCategory.value) {
    return groups;
  }

  // Filter contacts based on search and category
  Object.keys(groups).forEach(key => {
    groups[key].contacts = groups[key].contacts.filter(contact => {
      const searchContent = [
        contact.name,
        contact.title,
        contact.number,
        ...(contact.numbers || [])
      ].join(' ').toLowerCase();

      const matchesSearch = !searchQuery.value || 
        searchContent.includes(searchQuery.value.toLowerCase());

      const matchesCategory = !selectedCategory.value || 
        contact.category === selectedCategory.value;

      return matchesSearch && matchesCategory;
    });
  });

  return groups;
});

const isHighlighted = (contact) => {
  if (!searchQuery.value) return false;
  
  const query = searchQuery.value.toLowerCase();
  const searchContent = [
    contact.name,
    contact.title,
    contact.number,
    ...(contact.numbers || [])
  ].join(' ').toLowerCase();
  
  return searchContent.includes(query);
};
</script>
  
<style scoped>
.emergency-contacts {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #f8fafc;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: linear-gradient(135deg, #00D1D1, #00ADAD);
  border-radius: 16px;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header h1 {
  font-size: 2.8rem;
  margin-bottom: 1rem;
  font-weight: 700;
}

.header p {
  font-size: 1.3rem;
  opacity: 0.9;
}

.search-filter-container {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 3rem;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.search-box {
  flex: 2;
  position: relative;
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  font-size: 1.2rem;
}

.search-box input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 2.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #f8fafc;
}

.filter-box {
  flex: 1;
}

.filter-box select {
  width: 100%;
  padding: 0.875rem 2rem 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  background: #f8fafc;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1.5em;
}

.search-box input:focus,
.filter-box select:focus {
  border-color: #00D1D1;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 209, 209, 0.1);
  background: white;
}

.contact-group h2 {
  font-size: 1.8rem;
  color: #1e293b;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 3px solid #00D1D1;
}

.contacts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.contact-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
}

.contact-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
}

.contact-card i {
  font-size: 2.5rem;
  color: #00D1D1;
  margin-bottom: 1.5rem;
}

.contact-card h3 {
  font-size: 1.4rem;
  color: #1e293b;
  margin-bottom: 1rem;
  font-weight: 600;
}

.contact-card .name {
  font-size: 1.2rem;
  color: #64748b;
  margin: 0.5rem 0;
}

.contact-card .number {
  font-size: 1.1rem;
  color: #00ADAD;
  margin: 0.5rem 0;
  font-weight: 500;
}

.highlight {
  border: 2px solid #00D1D1;
  background: #f0fdfd;
}

@media (max-width: 640px) {
  .search-filter-container {
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
  }

  .search-box,
  .filter-box {
    flex: none;
    width: 100%;
  }

  .search-box input,
  .filter-box select {
    font-size: 0.95rem;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
  }

  .filter-box select {
    padding-left: 1rem;
  }
}
</style>