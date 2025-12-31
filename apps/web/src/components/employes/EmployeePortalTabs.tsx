'use client';

import { Employee } from '@/lib/api/employees';
import Tabs from '@/components/ui/Tabs';
import { TabList, Tab, TabPanels, TabPanel } from '@/components/ui/Tabs';
import { Card } from '@/components/ui';
import { 
  CheckSquare, 
  FolderKanban, 
  Clock, 
  Bot, 
  Calendar, 
  Receipt, 
  User 
} from 'lucide-react';
import EmployeePortalTasks from './EmployeePortalTasks';
import EmployeePortalProjects from './EmployeePortalProjects';
import EmployeePortalTimeSheets from './EmployeePortalTimeSheets';
import EmployeePortalLeo from './EmployeePortalLeo';
import EmployeePortalDeadlines from './EmployeePortalDeadlines';
import EmployeePortalExpenses from './EmployeePortalExpenses';
import EmployeePortalProfile from './EmployeePortalProfile';

interface EmployeePortalTabsProps {
  employee: Employee;
}

export default function EmployeePortalTabs({ employee }: EmployeePortalTabsProps) {
  return (
    <Card className="w-full rounded-none border-x-0">
      <Tabs defaultTab="tasks">
        <TabList className="border-b border-border px-4 sm:px-6 lg:px-8">
          <Tab value="tasks">
            <CheckSquare className="w-4 h-4 mr-2" />
            Mes tâches
          </Tab>
          <Tab value="projects">
            <FolderKanban className="w-4 h-4 mr-2" />
            Mes projets
          </Tab>
          <Tab value="timesheets">
            <Clock className="w-4 h-4 mr-2" />
            Mes feuilles de temps
          </Tab>
          <Tab value="leo">
            <Bot className="w-4 h-4 mr-2" />
            Mon Leo
          </Tab>
          <Tab value="deadlines">
            <Calendar className="w-4 h-4 mr-2" />
            Mes deadlines
          </Tab>
          <Tab value="expenses">
            <Receipt className="w-4 h-4 mr-2" />
            Mes comptes de dépenses
          </Tab>
          <Tab value="profile">
            <User className="w-4 h-4 mr-2" />
            Mon profil
          </Tab>
        </TabList>

        <TabPanels className="px-4 sm:px-6 lg:px-8 py-6">
          <TabPanel value="tasks">
            <EmployeePortalTasks employeeId={employee.id} />
          </TabPanel>
          <TabPanel value="projects">
            <EmployeePortalProjects employeeId={employee.id} />
          </TabPanel>
          <TabPanel value="timesheets">
            <EmployeePortalTimeSheets employeeId={employee.id} />
          </TabPanel>
          <TabPanel value="leo">
            <EmployeePortalLeo employeeId={employee.id} />
          </TabPanel>
          <TabPanel value="deadlines">
            <EmployeePortalDeadlines employeeId={employee.id} />
          </TabPanel>
          <TabPanel value="expenses">
            <EmployeePortalExpenses employeeId={employee.id} />
          </TabPanel>
          <TabPanel value="profile">
            <EmployeePortalProfile employee={employee} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Card>
  );
}
