const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Exercise = require('../models/Exercise');
const Workout = require('../models/Workout');

const exercisesData = [
  // Upper Body
  {
    name: 'Barbell Bench Press',
    category: 'strength',
    muscleGroups: ['Chest', 'Triceps', 'Front Shoulders'],
    equipment: ['Barbell', 'Bench'],
    difficulty: 'intermediate',
    description: 'Primary compound horizontal pushing exercise for pectoral and triceps strength.',
    instructions: [
      'Lie flat on the bench with eyes directly under the bar.',
      'Grip the bar slightly wider than shoulder-width with wrists straight.',
      'Unrack, lower the bar smoothly to mid-chest while tucking elbows ~45°.',
      'Press explosively back up, locking out elbows safely without hyperextending.'
    ],
    caloriesPerMinute: 6.5,
    isCompound: true,
  },
  {
    name: 'Incline Dumbbell Press',
    category: 'strength',
    muscleGroups: ['Upper Chest', 'Front Shoulders', 'Triceps'],
    equipment: ['Dumbbells', 'Incline Bench'],
    difficulty: 'intermediate',
    description: 'Targeted upper pectoral builder that promotes balanced shoulder mobility.',
    instructions: [
      'Set bench to a 30-45 degree incline.',
      'Bring dumbbells up to shoulder level with palms facing forward.',
      'Press upwards towards each other in an arc without clanking the weights.',
      'Control the descent until elbows reach chest depth.'
    ],
    caloriesPerMinute: 6.0,
    isCompound: true,
  },
  {
    name: 'Push-ups',
    category: 'strength',
    muscleGroups: ['Chest', 'Triceps', 'Core'],
    equipment: ['Bodyweight'],
    difficulty: 'beginner',
    description: 'Essential bodyweight pushing movement strengthening the upper body and anterior core.',
    instructions: [
      'Assume a high plank with hands placed under shoulders and core braced.',
      'Lower your chest until 2 inches above the floor, keeping body in a straight line.',
      'Push firmly through your palms to return to starting position.'
    ],
    caloriesPerMinute: 5.5,
    isCompound: true,
  },
  {
    name: 'Knee Push-ups (Low Impact)',
    category: 'strength',
    muscleGroups: ['Chest', 'Triceps', 'Core'],
    equipment: ['Bodyweight'],
    difficulty: 'beginner',
    description: 'Beginner-friendly regression of the standard push-up reducing load on wrists and lower back.',
    instructions: [
      'Kneel on the floor with knees hip-width apart and hands under shoulders.',
      'Maintain a neutral spine from knees to neck.',
      'Lower chest towards the floor and press up with control.'
    ],
    caloriesPerMinute: 4.5,
    isCompound: true,
  },
  {
    name: 'Barbell Bent-Over Row',
    category: 'strength',
    muscleGroups: ['Upper Back', 'Lats', 'Biceps', 'Posterior Delts'],
    equipment: ['Barbell'],
    difficulty: 'intermediate',
    description: 'Foundational horizontal pulling movement developing back thickness and spinal posture.',
    instructions: [
      'Hinge hips back with knees slightly bent and torso roughly 45 degrees to the floor.',
      'Grip bar just outside shoulder width.',
      'Pull the bar to your lower ribcage, squeezing shoulder blades together.',
      'Lower bar with complete control without rounding your lower back.'
    ],
    caloriesPerMinute: 6.5,
    isCompound: true,
  },
  {
    name: 'Dumbbell Single-Arm Row',
    category: 'strength',
    muscleGroups: ['Lats', 'Upper Back', 'Biceps'],
    equipment: ['Dumbbells', 'Bench'],
    difficulty: 'beginner',
    description: 'Unilateral back exercise correcting side-to-side strength imbalances with low lumbar fatigue.',
    instructions: [
      'Place one knee and one hand on a flat bench with spine parallel to floor.',
      'Hold a dumbbell in free hand, arm fully extended.',
      'Drive elbow up and back towards the hip, engaging the lat muscle.',
      'Lower slowly to full stretch.'
    ],
    caloriesPerMinute: 5.5,
    isCompound: true,
  },
  {
    name: 'Pull-ups',
    category: 'strength',
    muscleGroups: ['Lats', 'Biceps', 'Rhomboids'],
    equipment: ['Pull-up Bar'],
    difficulty: 'advanced',
    description: 'Pinnacle vertical pulling exercise for lat development and relative bodyweight power.',
    instructions: [
      'Grip the bar slightly wider than shoulder width with an overhand grip.',
      'Engage scapulae downwards, pull chest toward the bar until chin clears it.',
      'Lower under complete control to a full hang before starting next rep.'
    ],
    caloriesPerMinute: 7.0,
    isCompound: true,
  },
  {
    name: 'Dumbbell Bicep Curls',
    category: 'strength',
    muscleGroups: ['Biceps', 'Forearms'],
    equipment: ['Dumbbells'],
    difficulty: 'beginner',
    description: 'Isolation exercise targeting elbow flexion and forearm grip endurance.',
    instructions: [
      'Stand upright with a dumbbell in each hand, palms facing forward.',
      'Keep elbows pinned to your sides and curl weights towards shoulders.',
      'Squeeze biceps at the top for 1 second, then lower steadily.'
    ],
    caloriesPerMinute: 4.5,
    isCompound: false,
  },
  {
    name: 'Overhead Dumbbell Triceps Extension',
    category: 'strength',
    muscleGroups: ['Triceps (Long Head)'],
    equipment: ['Dumbbells'],
    difficulty: 'beginner',
    description: 'Isolates the long head of the triceps via overhead elbow extension.',
    instructions: [
      'Sit or stand holding a single dumbbell vertically overhead with both hands.',
      'Lower the weight behind your head by bending at the elbows.',
      'Extend arms back to the top while keeping elbows pointing straight forward.'
    ],
    caloriesPerMinute: 4.5,
    isCompound: false,
  },

  // Lower Body
  {
    name: 'Barbell Back Squat',
    category: 'strength',
    muscleGroups: ['Quads', 'Glutes', 'Hamstrings', 'Lower Back'],
    equipment: ['Barbell', 'Squat Rack'],
    difficulty: 'intermediate',
    description: 'The cornerstone lower body compound lift for maximum quadricep and hip power.',
    instructions: [
      'Rest bar across upper traps with chest tall and feet shoulder-width apart.',
      'Inhale, brace core, and break at hips and knees simultaneously.',
      'Descend until thighs are at least parallel to floor.',
      'Drive through mid-foot to stand back up, exhaling near the top.'
    ],
    caloriesPerMinute: 8.0,
    isCompound: true,
  },
  {
    name: 'Goblet Squat',
    category: 'strength',
    muscleGroups: ['Quads', 'Glutes', 'Core'],
    equipment: ['Dumbbells'],
    difficulty: 'beginner',
    description: 'Accessible squat variation emphasizing upright posture, knee tracking, and hip mobility.',
    instructions: [
      'Hold a dumbbell or kettlebell vertically against your chest with elbows tucked.',
      'Squat down between your hips, pushing knees outward in line with toes.',
      'Drive through heels to stand upright.'
    ],
    caloriesPerMinute: 6.0,
    isCompound: true,
  },
  {
    name: 'Romanian Deadlift (RDL)',
    category: 'strength',
    muscleGroups: ['Hamstrings', 'Glutes', 'Erectors'],
    equipment: ['Barbell', 'Dumbbells'],
    difficulty: 'intermediate',
    description: 'Pure hip-hinge exercise for developing the posterior chain and hamstring resilience.',
    instructions: [
      'Stand holding weights at hip height with slight bend in knees.',
      'Push hips back while keeping spine neutral and weights gliding along legs.',
      'Stop when you feel deep tension in hamstrings (around mid-shin).',
      'Drive hips forward to return to standing.'
    ],
    caloriesPerMinute: 7.0,
    isCompound: true,
  },
  {
    name: 'Bodyweight Walking Lunges',
    category: 'strength',
    muscleGroups: ['Quads', 'Glutes', 'Calves'],
    equipment: ['Bodyweight'],
    difficulty: 'beginner',
    description: 'Dynamic unilateral leg exercise enhancing balance, hip stability, and quad endurance.',
    instructions: [
      'Step forward with right foot and lower hips until both knees form 90° angles.',
      'Keep front knee stacked over front ankle.',
      'Push through right heel and step forward directly into left lunge.'
    ],
    caloriesPerMinute: 6.5,
    isCompound: true,
  },

  // Core & HIIT
  {
    name: 'Plank Hold',
    category: 'strength',
    muscleGroups: ['Transverse Abdominis', 'Obliques', 'Shoulders'],
    equipment: ['Bodyweight'],
    difficulty: 'beginner',
    description: 'Isometric core builder reinforcing anti-extension spinal stability.',
    instructions: [
      'Rest on forearms and toes with elbows directly under shoulders.',
      'Tuck pelvis and squeeze glutes and abs tight.',
      'Maintain a rigid straight line without letting hips sag.'
    ],
    caloriesPerMinute: 4.5,
    isCompound: false,
  },
  {
    name: 'Mountain Climbers',
    category: 'hiit',
    muscleGroups: ['Core', 'Hip Flexors', 'Shoulders', 'Cardiovascular'],
    equipment: ['Bodyweight'],
    difficulty: 'beginner',
    description: 'High-intensity dynamic core and cardio conditioner with zero equipment.',
    instructions: [
      'Start in a strong plank position.',
      'Drive right knee rapidly toward chest, tap floor, and switch legs smoothly.',
      'Keep hips level and pace steady for duration of interval.'
    ],
    caloriesPerMinute: 8.5,
    isCompound: true,
  },
  {
    name: 'Burpees (Full Body)',
    category: 'hiit',
    muscleGroups: ['Full Body', 'Cardiovascular', 'Legs', 'Chest'],
    equipment: ['Bodyweight'],
    difficulty: 'advanced',
    description: 'Total-body metabolic power exercise driving maximum heart rate and caloric expenditure.',
    instructions: [
      'Drop hands to floor from standing, kick feet back into plank.',
      'Perform a controlled push-up to touch chest to floor.',
      'Snap feet forward toward hands and leap vertically with hands overhead.'
    ],
    caloriesPerMinute: 10.0,
    isCompound: true,
  },
  {
    name: 'Low-Impact Step Burpees',
    category: 'hiit',
    muscleGroups: ['Full Body', 'Core', 'Legs'],
    equipment: ['Bodyweight'],
    difficulty: 'beginner',
    description: 'Gentle, zero-jumping regression of the burpee safe on knees and spine.',
    instructions: [
      'Place hands on floor, step one foot back at a time into high plank.',
      'Hold plank 1 second (skip pushup if needed).',
      'Step feet forward one at a time and stand tall with arms overhead.'
    ],
    caloriesPerMinute: 6.5,
    isCompound: true,
  },

  // Mobility & Recovery
  {
    name: "World's Greatest Stretch",
    category: 'flexibility',
    muscleGroups: ['Hips', 'Hamstrings', 'Thoracic Spine', 'Groin'],
    equipment: ['Bodyweight'],
    difficulty: 'beginner',
    description: 'Comprehensive dynamic mobility movement loosening hips and opening the thoracic spine.',
    instructions: [
      'Step into a deep forward lunge with both hands on inside of front foot.',
      'Rotate upper torso towards front knee, extending that arm toward ceiling.',
      'Return hand down, sink into hip stretch, switch sides.'
    ],
    caloriesPerMinute: 3.5,
    isCompound: false,
  },
  {
    name: 'Cat-Cow Spinal Flow',
    category: 'flexibility',
    muscleGroups: ['Spine', 'Neck', 'Abdominals'],
    equipment: ['Bodyweight'],
    difficulty: 'beginner',
    description: 'Gentle rhythmic spinal decompression that improves segmental spinal mobility.',
    instructions: [
      'On hands and knees, inhale as you arch back and lift chin (Cow).',
      'Exhale as you round spine upward, tucking chin to chest (Cat).',
      'Repeat slowly with relaxed breathing.'
    ],
    caloriesPerMinute: 3.0,
    isCompound: false,
  }
];

async function seedWorkouts() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/healthfit');
    console.log('Connected to MongoDB. Seeding workouts and exercises...');

    // 1. Seed or upsert exercises
    const exerciseMap = {};
    for (const exData of exercisesData) {
      const ex = await Exercise.findOneAndUpdate(
        { name: exData.name },
        exData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      exerciseMap[ex.name] = ex._id;
    }
    console.log(`Seeded ${Object.keys(exerciseMap).length} exercises successfully.`);

    // 2. Define Evidence-Based Structured Workout Programs
    const workoutsData = [
      {
        name: 'Upper Body Push & Core',
        description: 'Evidence-based push session targeting chest, shoulders, and triceps with core stability.',
        category: 'muscle_building',
        difficulty: 'intermediate',
        duration: 45,
        totalCalories: 310,
        equipment: ['Barbell', 'Dumbbells', 'Bench'],
        isPublic: true,
        exercises: [
          {
            exercise: exerciseMap['Barbell Bench Press'],
            exerciseName: 'Barbell Bench Press',
            sets: 4,
            reps: 8,
            weight: 60,
            restSeconds: 90,
            notes: 'Primary horizontal press. Focus on smooth bar path to lower chest.'
          },
          {
            exercise: exerciseMap['Incline Dumbbell Press'],
            exerciseName: 'Incline Dumbbell Press',
            sets: 3,
            reps: 10,
            weight: 22,
            restSeconds: 75,
            notes: 'Upper pec hypertrophy. Control the stretch at the bottom.'
          },
          {
            exercise: exerciseMap['Push-ups'],
            exerciseName: 'Push-ups',
            sets: 3,
            reps: 15,
            weight: 0,
            restSeconds: 60,
            notes: 'Bodyweight finisher. Maintain strict plank position.'
          },
          {
            exercise: exerciseMap['Overhead Dumbbell Triceps Extension'],
            exerciseName: 'Overhead Dumbbell Triceps Extension',
            sets: 3,
            reps: 12,
            weight: 14,
            restSeconds: 60,
            notes: 'Long head triceps isolation. Keep elbows pointed forward.'
          },
          {
            exercise: exerciseMap['Plank Hold'],
            exerciseName: 'Plank Hold',
            sets: 3,
            duration: 45,
            reps: 1,
            weight: 0,
            restSeconds: 45,
            notes: 'Anti-extension core stabilization. Squeeze glutes and abs.'
          }
        ]
      },
      {
        name: 'Upper Body Pull & Posture',
        description: 'Complete back and bicep hypertrophy program designed to improve scapular posture and pull strength.',
        category: 'muscle_building',
        difficulty: 'intermediate',
        duration: 45,
        totalCalories: 295,
        equipment: ['Barbell', 'Dumbbells', 'Pull-up Bar'],
        isPublic: true,
        exercises: [
          {
            exercise: exerciseMap['Barbell Bent-Over Row'],
            exerciseName: 'Barbell Bent-Over Row',
            sets: 4,
            reps: 8,
            weight: 50,
            restSeconds: 90,
            notes: 'Hinge deeply at hips. Pull bar smoothly into lower sternum.'
          },
          {
            exercise: exerciseMap['Pull-ups'],
            exerciseName: 'Pull-ups',
            sets: 3,
            reps: 8,
            weight: 0,
            restSeconds: 90,
            notes: 'Full range vertical pull. Substitute with lat pulldown or band if needed.'
          },
          {
            exercise: exerciseMap['Dumbbell Single-Arm Row'],
            exerciseName: 'Dumbbell Single-Arm Row',
            sets: 3,
            reps: 10,
            weight: 20,
            restSeconds: 60,
            notes: 'Unilateral lat development. Pull elbow back toward hip.'
          },
          {
            exercise: exerciseMap['Dumbbell Bicep Curls'],
            exerciseName: 'Dumbbell Bicep Curls',
            sets: 3,
            reps: 12,
            weight: 12,
            restSeconds: 60,
            notes: 'Controlled elbow flexion. Avoid swinging the torso.'
          }
        ]
      },
      {
        name: 'Lower Body Strength & Hinge',
        description: 'Quad and hamstring foundation developing functional leg power, knee health, and hip mechanics.',
        category: 'strength',
        difficulty: 'intermediate',
        duration: 50,
        totalCalories: 360,
        equipment: ['Barbell', 'Dumbbells', 'Squat Rack'],
        isPublic: true,
        exercises: [
          {
            exercise: exerciseMap['Barbell Back Squat'],
            exerciseName: 'Barbell Back Squat',
            sets: 4,
            reps: 6,
            weight: 70,
            restSeconds: 120,
            notes: 'Heavy compound squat. Maintain braced core throughout descent.'
          },
          {
            exercise: exerciseMap['Romanian Deadlift (RDL)'],
            exerciseName: 'Romanian Deadlift (RDL)',
            sets: 3,
            reps: 8,
            weight: 60,
            restSeconds: 90,
            notes: 'Hamstring & glute hinge. Push hips backward until deep hamstring stretch.'
          },
          {
            exercise: exerciseMap['Bodyweight Walking Lunges'],
            exerciseName: 'Bodyweight Walking Lunges',
            sets: 3,
            reps: 12,
            weight: 0,
            restSeconds: 60,
            notes: '12 reps each leg. Keep front knee tracking directly over toes.'
          },
          {
            exercise: exerciseMap['Plank Hold'],
            exerciseName: 'Plank Hold',
            sets: 3,
            duration: 60,
            reps: 1,
            weight: 0,
            restSeconds: 45,
            notes: 'Isometric core reinforcement after heavy lower body loading.'
          }
        ]
      },
      {
        name: 'Metabolic Fat-Burn HIIT',
        description: 'High-intensity interval cardio engineered to maximize caloric burn and aerobic capacity.',
        category: 'hiit',
        difficulty: 'intermediate',
        duration: 25,
        totalCalories: 260,
        equipment: ['Bodyweight'],
        isPublic: true,
        exercises: [
          {
            exercise: exerciseMap['Burpees (Full Body)'],
            exerciseName: 'Burpees (Full Body)',
            sets: 4,
            reps: 10,
            weight: 0,
            restSeconds: 45,
            notes: 'High power output. Use Low-Impact Step Burpees if joint relief needed.'
          },
          {
            exercise: exerciseMap['Mountain Climbers'],
            exerciseName: 'Mountain Climbers',
            sets: 4,
            duration: 30,
            reps: 20,
            weight: 0,
            restSeconds: 30,
            notes: 'Maintain steady rhythm while keeping shoulders stacked above wrists.'
          },
          {
            exercise: exerciseMap['Bodyweight Walking Lunges'],
            exerciseName: 'Bodyweight Walking Lunges',
            sets: 3,
            reps: 15,
            weight: 0,
            restSeconds: 45,
            notes: 'Continuous pace leg conditioning.'
          },
          {
            exercise: exerciseMap['Push-ups'],
            exerciseName: 'Push-ups',
            sets: 3,
            reps: 12,
            weight: 0,
            restSeconds: 45,
            notes: 'Chest and triceps stamina.'
          }
        ]
      },
      {
        name: 'Home Bodyweight Sculpt',
        description: 'Zero-equipment full body routine suitable for home workouts or travel.',
        category: 'home',
        difficulty: 'beginner',
        duration: 30,
        totalCalories: 200,
        equipment: ['Bodyweight'],
        isPublic: true,
        exercises: [
          {
            exercise: exerciseMap['Push-ups'],
            exerciseName: 'Push-ups',
            sets: 3,
            reps: 10,
            weight: 0,
            restSeconds: 60,
            notes: 'Use Knee Push-ups modification if needed.'
          },
          {
            exercise: exerciseMap['Bodyweight Walking Lunges'],
            exerciseName: 'Bodyweight Walking Lunges',
            sets: 3,
            reps: 12,
            weight: 0,
            restSeconds: 60,
            notes: 'Smooth, controlled pacing.'
          },
          {
            exercise: exerciseMap['Plank Hold'],
            exerciseName: 'Plank Hold',
            sets: 3,
            duration: 35,
            reps: 1,
            weight: 0,
            restSeconds: 45,
            notes: 'Solid core engagement.'
          },
          {
            exercise: exerciseMap['Mountain Climbers'],
            exerciseName: 'Mountain Climbers',
            sets: 3,
            duration: 30,
            reps: 16,
            weight: 0,
            restSeconds: 45,
            notes: 'Moderate pace for cardiovascular activation.'
          }
        ]
      },
      {
        name: 'Full Body Joint Mobility & Recovery',
        description: 'Restorative mobility flow promoting synovial fluid circulation, spine decompression, and muscle recovery.',
        category: 'mobility',
        difficulty: 'beginner',
        duration: 20,
        totalCalories: 95,
        equipment: ['Bodyweight'],
        isPublic: true,
        exercises: [
          {
            exercise: exerciseMap["World's Greatest Stretch"],
            exerciseName: "World's Greatest Stretch",
            sets: 3,
            reps: 6,
            weight: 0,
            restSeconds: 30,
            notes: '6 reps per side. Inhale as you reach arm upwards, open chest.'
          },
          {
            exercise: exerciseMap['Cat-Cow Spinal Flow'],
            exerciseName: 'Cat-Cow Spinal Flow',
            sets: 3,
            reps: 10,
            weight: 0,
            restSeconds: 30,
            notes: 'Slow synchronous breathing. Mobilize each spinal segment.'
          },
          {
            exercise: exerciseMap['Plank Hold'],
            exerciseName: 'Plank Hold',
            sets: 2,
            duration: 30,
            reps: 1,
            weight: 0,
            restSeconds: 30,
            notes: 'Light isometric activation to set posture.'
          }
        ]
      }
    ];

    await Workout.deleteMany({});
    for (const wData of workoutsData) {
      await Workout.create(wData);
    }
    console.log(`Seeded ${workoutsData.length} structured workouts successfully.`);

    await mongoose.disconnect();
    console.log('Seeder completed successfully.');
  } catch (err) {
    console.error('Seeder error:', err);
    process.exit(1);
  }
}

seedWorkouts();
