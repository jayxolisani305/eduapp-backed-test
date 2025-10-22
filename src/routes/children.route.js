import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { parentId } = params;
    
    // Verify authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the requesting user has access to this parent's data
    const currentUser = await prisma.users.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser || (currentUser.id !== parentId && currentUser.role !== 'admin')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get children linked to this parent
    const relationships = await prisma.parent_children.findMany({
      where: {
        parent_id: parentId
      },
      include: {
        child: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: true
          }
        }
      }
    });

    // For each child, get their student details (grades, attendance, etc.)
    const childrenWithDetails = await Promise.all(
      relationships.map(async (rel) => {
        // Get student stats - you might need to adjust this based on your student data structure
        const studentStats = await prisma.$queryRaw`
          SELECT 
            COALESCE(AVG(g.score), 0) as overall_average,
            COALESCE((
              SELECT COUNT(*) 
              FROM attendance att 
              WHERE att.student_id = ${rel.child_id} 
              AND att.status = 'present'
            ) * 100.0 / NULLIF((
              SELECT COUNT(*) 
              FROM attendance att 
              WHERE att.student_id = ${rel.child_id}
            ), 0), 100) as attendance_rate
          FROM grades g
          WHERE g.student_id = ${rel.child_id}
        `;

        const stats = studentStats[0] || { overall_average: 0, attendance_rate: 100 };

        return {
          id: rel.child_id,
          full_name: rel.child.full_name,
          email: rel.child.email,
          grade_level: 10, // You'll need to store this in users table or separate students table
          class_name: 'Class A', // You'll need to store this
          overall_average: Number(stats.overall_average) || 0,
          attendance_rate: Number(stats.attendance_rate) || 100,
          relationship_id: rel.id,
          relationship_type: rel.relationship_type
        };
      })
    );

    return NextResponse.json(childrenWithDetails);
  } catch (error) {
    console.error('Error fetching children:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}