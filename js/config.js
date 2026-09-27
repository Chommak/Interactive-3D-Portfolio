// ============================================================
// แก้ไขข้อมูลส่วนตัวของเจ้าของพอร์ตโฟลิโอตรงนี้ที่เดียว
// ข้อมูลจะถูกนำไปแปะบนป้าย 3 มิติในฉาก + แผงข้อมูลตอนคลิก
// ============================================================
export const PROFILE = {
  nameTh: 'ชื่อจริง นามสกุล',
  nameEn: 'Your Name Here',
  nickname: 'ชื่อเล่น',
  studentId: '6600000000',
  university: 'มหาวิทยาลัยของคุณ',
  faculty: 'คณะศิลปกรรมศาสตร์',
  major: 'สาขาวิชาเทคโนโลยีสร้างสรรค์',
  bio: 'สวัสดี! เราชอบงาน 3D อนิเมชัน เกม และイラスト กำลังฝึก Three.js อยู่ครับ/ค่ะ',
  address: '99/9 หมู่ 1 ถนนสุขุมวิท ตำบลบางปู อำเภอเมือง จังหวัดสมุทรปราการ 10280',
  email: 'your.name@mail.university.ac.th',
  phone: '08x-xxx-xxxx',
  socials: [
    { label: 'GitHub', url: 'https://github.com/yourname' },
    { label: 'Facebook', url: 'https://facebook.com/yourname' },
    { label: 'ArtStation', url: 'https://artstation.com/yourname' },
  ],
  skills: ['Three.js', 'JavaScript', 'Blender', 'HTML/CSS', 'Photoshop', 'Illustrator'],
  projects: [
    {
      title: 'Sakura Room',
      desc: 'ฉากห้องนอนสไตล์อนิเมะแบบ low-poly ทำด้วย Blender แล้วนำเข้ามาเรนเดอร์ต่อในเว็บด้วย three.js พร้อมแสงเงาแบบ cel shading',
      tags: ['Blender', 'Three.js', 'glTF'],
      color: '#f7a8c4',
    },
    {
      title: 'Pixel Quest',
      desc: 'เกม 2D แนว puzzle platformer บนเว็บ ใช้ vanilla JavaScript + Canvas API เขียนระบบฟิสิกส์และ tilemap เองทั้งหมด',
      tags: ['JavaScript', 'Canvas', 'Game'],
      color: '#8ec9f0',
    },
    {
      title: 'Cafe Finder App',
      desc: 'เว็บแอปแนะนำคาเฟ่ใกล้ตัว ใช้ API แผนที่จริง มีระบบกรองร้านและบันทึกร้านโปรดลง localStorage',
      tags: ['HTML/CSS', 'REST API', 'UI/UX'],
      color: '#b8e6a5',
    },
  ],
};
